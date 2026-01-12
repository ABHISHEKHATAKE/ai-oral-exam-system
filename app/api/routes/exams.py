from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from app.models.schemas import ExamRequest, ExamResponse
from app.api.dependencies import require_role, get_current_user
from app.services.exam_service import exam_service
from app.core.security import decode_token
from datetime import datetime
import json
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))


router = APIRouter(prefix="/api/exams", tags=["Exams"])

@router.post("/start", response_model=ExamResponse)
def start_exam(
    request: ExamRequest,
    user: dict = Depends(require_role("student"))
):
    """Start an exam session"""
    # Verify student is starting their own exam
    student = exam_service.students.get(request.student_id)
    if not student or student['email'] != user["sub"]:
        raise HTTPException(403, "You can only start your own exam")
    
    # Check if can start
    can_start, message = exam_service.can_start_exam(request.student_id)
    if not can_start:
        raise HTTPException(400, message)
    
    # Start exam
    result = exam_service.start_exam(request.student_id)
    
    return ExamResponse(
        exam_id=result['exam_id'],
        student_id=request.student_id,
        student_name=result['student_name'],
        status="in_progress",
        created_at=datetime.now(IST).isoformat()
    )

@router.websocket("/ws/{exam_id}")
async def exam_websocket(websocket: WebSocket, exam_id: str):
    """WebSocket for real-time exam interaction"""
    await websocket.accept()
    
    # Authenticate via query param token
    token = websocket.query_params.get("token")
    if not token:
        await websocket.send_json({"error": "Authentication required"})
        await websocket.close()
        return
    
    try:
        user = decode_token(token)
        if user["role"] != "student":
            await websocket.send_json({"error": "Only students can take exams"})
            await websocket.close()
            return
    except:
        await websocket.send_json({"error": "Invalid token"})
        await websocket.close()
        return
    
    # Verify exam exists
    if exam_id not in exam_service.active_exams:
        await websocket.send_json({"error": "Invalid exam ID"})
        await websocket.close()
        return
    
    exam = exam_service.active_exams[exam_id]
    
    # Send first question
    await websocket.send_json({
        "type": "question",
        "content": exam.get("first_question", "Please introduce yourself.")
    })
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "answer":
                answer = data.get("content")
                response_time = data.get("response_time", 0)
                
                # Process answer
                result = exam_service.process_answer(exam_id, answer, response_time)
                
                # Send next question
                await websocket.send_json({
                    "type": "question",
                    "content": result['next_question'],
                    "question_number": result['question_number']
                })
            
            elif data.get("type") == "end_exam":
                # End exam and get results
                final_result = exam_service.end_exam(exam_id)
                
                await websocket.send_json({
                    "type": "exam_complete",
                    "message": "Exam completed successfully",
                    "data": final_result
                })
                break
    
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for exam {exam_id}")
    except Exception as e:
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()
