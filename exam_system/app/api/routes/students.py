# ============================================================================
# FILE: app/api/routes/students.py - COMPLETE REPLACEMENT
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import StudentProfile, DashboardResponse
from app.api.dependencies import require_role, get_current_user
from app.services.exam_service import exam_service
from datetime import datetime
from app.core.security import IST
from typing import List

router = APIRouter(prefix="/api/student", tags=["Students"])

@router.post("/profile")
def create_profile(
    profile: StudentProfile,
    user: dict = Depends(require_role("student"))
):
    """Create student profile"""
    # Verify student is creating their own profile
    if profile.email != user["sub"]:
        raise HTTPException(403, "You can only create your own profile")
    
    # Register student in exam system
    exam_service.register_student({
        "student_id": profile.student_id,
        "name": profile.name,
        "email": profile.email,
        "project_details": {
            "title": profile.project_title,
            "description": profile.project_description,
            "technologies": profile.technologies,
            "metrics": profile.metrics
        },
        "case_study": profile.case_study
    })
    
    return {
        "message": "Profile created successfully",
        "student_id": profile.student_id
    }

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(user: dict = Depends(require_role("student"))):
    """Get student dashboard data"""
    student_email = user["sub"]
    
    # Find student by email
    student_data = None
    student_id = None
    for sid, data in exam_service.students.items():
        if data.get("email") == student_email:
            student_data = data
            student_id = sid
            break
    
    if not student_data:
        return DashboardResponse(
            name="",
            upcoming_exams=[],
            past_results=[],
            profile_complete=False
        )
    
    # Get upcoming exams
    upcoming = []
    if student_id in exam_service.exam_schedules:
        schedule = exam_service.exam_schedules[student_id]
        if schedule['end_time'] > datetime.now(IST):
            upcoming.append({
                "start_time": schedule['start_time'].isoformat(),
                "duration": schedule['duration_minutes']
            })
    
    # Get past results - look through completed exams
    past_results = []
    for exam_id, exam_data in exam_service.active_exams.items():
        if exam_data['student_id'] == student_id and exam_data['status'] == 'completed':
            # Calculate basic score info
            total_questions = len([r for r in exam_data.get('transcript', []) if r.get('role') == 'assistant'])
            total_score = min(20, total_questions * 2)
            
            past_results.append({
                "exam_id": exam_id,
                "completed_at": exam_data.get('completed_at', datetime.now(IST)).isoformat() if hasattr(exam_data.get('completed_at'), 'isoformat') else str(exam_data.get('completed_at')),
                "total_score": total_score,
                "total_questions": total_questions,
                "risk_level": exam_data.get('risk_level', 'UNKNOWN')
            })
    
    return DashboardResponse(
        name=student_data['name'],
        upcoming_exams=upcoming,
        past_results=past_results,
        profile_complete=True
    )

@router.get("/results")
def get_my_results(user: dict = Depends(require_role("student"))):
    """Get all exam results for the logged-in student"""
    student_email = user["sub"]
    
    # Find student ID by email
    student_id = None
    student_name = ""
    for sid, data in exam_service.students.items():
        if data.get("email") == student_email:
            student_id = sid
            student_name = data.get("name", "")
            break
    
    if not student_id:
        raise HTTPException(404, "Student profile not found. Please create your profile first.")
    
    # Get all completed exams for this student
    results = []
    for exam_id, exam_data in exam_service.active_exams.items():
        if exam_data['student_id'] == student_id and exam_data['status'] == 'completed':
            # Calculate scores
            total_questions = len([r for r in exam_data.get('transcript', []) if r.get('role') == 'assistant'])
            total_score = min(20, total_questions * 2)
            
            # Calculate average cheat score
            responses = exam_data.get('responses', [])
            avg_cheat_score = sum(r.get('cheat_score', 0) for r in responses) / len(responses) if responses else 0
            
            results.append({
                "exam_id": exam_id,
                "completed_at": exam_data.get('completed_at', datetime.now(IST)).isoformat() if hasattr(exam_data.get('completed_at'), 'isoformat') else str(exam_data.get('completed_at')),
                "total_score": total_score,
                "max_score": 20,
                "percentage": (total_score / 20) * 100,
                "scores": {
                    "technical_knowledge": total_score * 0.4,
                    "problem_solving": total_score * 0.3,
                    "communication": total_score * 0.3
                },
                "total_questions": total_questions,
                "risk_level": exam_data.get('risk_level', 'LOW'),
                "suspicion_score": avg_cheat_score,
                "feedback": "Your exam has been evaluated. Great job!" if avg_cheat_score < 3 else "Your performance has been recorded. Please contact your instructor for detailed feedback."
            })
    
    return {
        "student_id": student_id,
        "student_name": student_name,
        "total_exams": len(results),
        "results": results
    }

@router.get("/results/{exam_id}")
def get_specific_result(exam_id: str, user: dict = Depends(require_role("student"))):
    """Get detailed results for a specific exam"""
    student_email = user["sub"]
    
    # Find student ID
    student_id = None
    for sid, data in exam_service.students.items():
        if data.get("email") == student_email:
            student_id = sid
            break
    
    if not student_id:
        raise HTTPException(404, "Student profile not found")
    
    # Check if exam exists
    if exam_id not in exam_service.active_exams:
        raise HTTPException(404, "Exam not found")
    
    exam_data = exam_service.active_exams[exam_id]
    
    # Verify this exam belongs to the student
    if exam_data['student_id'] != student_id:
        raise HTTPException(403, "You can only view your own exam results")
    
    # Check if exam is completed
    if exam_data['status'] != 'completed':
        raise HTTPException(400, "Exam is not yet completed")
    
    # Calculate detailed results
    total_questions = len([r for r in exam_data.get('transcript', []) if r.get('role') == 'assistant'])
    total_score = min(20, total_questions * 2)
    
    responses = exam_data.get('responses', [])
    avg_cheat_score = sum(r.get('cheat_score', 0) for r in responses) / len(responses) if responses else 0
    
    # Get conversation transcript
    transcript = exam_data.get('transcript', [])
    
    return {
        "exam_id": exam_id,
        "student_id": student_id,
        "completed_at": exam_data.get('completed_at', datetime.now(IST)).isoformat() if hasattr(exam_data.get('completed_at'), 'isoformat') else str(exam_data.get('completed_at')),
        "total_score": total_score,
        "max_score": 20,
        "percentage": (total_score / 20) * 100,
        "scores": {
            "technical_knowledge": total_score * 0.4,
            "problem_solving": total_score * 0.3,
            "communication": total_score * 0.3
        },
        "total_questions": total_questions,
        "total_answers": len([r for r in transcript if r.get('role') == 'user']),
        "risk_level": exam_data.get('risk_level', 'LOW'),
        "suspicion_score": avg_cheat_score,
        "cheat_flags": exam_data.get('cheat_indicators', []),
        "feedback": "Your performance has been recorded. Great work!" if avg_cheat_score < 3 else "Your exam has been completed. Contact your instructor for detailed feedback.",
        "transcript_available": len(transcript) > 0
    }