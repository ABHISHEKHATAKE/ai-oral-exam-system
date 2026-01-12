from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.schemas import (
    ExamSchedule, 
    StudentDetailResponse, 
    GradingResult
)
from app.api.dependencies import require_role
from app.services.exam_service import exam_service
from datetime import datetime
from app.core.security import IST

router = APIRouter(prefix="/api/instructor", tags=["Instructor"])
@router.get("/results")
def get_all_results(user: dict = Depends(require_role("instructor"))):
    """Get all exam results for all students"""
    all_results = []
    
    for exam_id, exam_data in exam_service.active_exams.items():
        if exam_data['status'] == 'completed':
            student_id = exam_data['student_id']
            student_name = exam_service.students.get(student_id, {}).get('name', 'Unknown')
            
            # Calculate scores
            total_questions = len([r for r in exam_data.get('transcript', []) if r.get('role') == 'assistant'])
            total_score = min(20, total_questions * 2)
            
            # Calculate average cheat score
            responses = exam_data.get('responses', [])
            avg_cheat_score = sum(r.get('cheat_score', 0) for r in responses) / len(responses) if responses else 0
            
            all_results.append({
                "exam_id": exam_id,
                "student_id": student_id,
                "student_name": student_name,
                "completed_at": exam_data.get('completed_at', datetime.now(IST)).isoformat() if hasattr(exam_data.get('completed_at'), 'isoformat') else str(exam_data.get('completed_at')),
                "total_score": total_score,
                "max_score": 20,
                "percentage": (total_score / 20) * 100,
                "risk_level": exam_data.get('risk_level', 'LOW'),
                "suspicion_score": avg_cheat_score,
                "total_questions": total_questions
            })
    
    # Sort by completed_at (most recent first)
    all_results.sort(key=lambda x: x['completed_at'], reverse=True)
    
    return {
        "total_results": len(all_results),
        "results": all_results
    }
@router.get("/students")
def list_students(user: dict = Depends(require_role("instructor"))):
    """Get list of all registered students"""
    students = [
        {
            "student_id": sid,
            "name": data['name'],
            "email": data['email'],
            "project_title": data['project_details']['title']
        }
        for sid, data in exam_service.students.items()
    ]
    
    return {"students": students, "total": len(students)}

@router.get("/students/{student_id}", response_model=StudentDetailResponse)
def get_student_details(
    student_id: str,
    user: dict = Depends(require_role("instructor"))
):
    """Get detailed info for a specific student"""
    if student_id not in exam_service.students:
        raise HTTPException(404, "Student not found")
    
    student = exam_service.students[student_id]
    return StudentDetailResponse(
        student_id=student_id,
        name=student['name'],
        email=student['email'],
        project_details=student['project_details'],
        case_study=student['case_study']
    )

@router.post("/schedule-exam")
def schedule_exam(
    schedule: ExamSchedule,
    user: dict = Depends(require_role("instructor"))
):
    """Schedule an exam for a student"""
    if schedule.student_id not in exam_service.students:
        raise HTTPException(404, "Student not found")
    
    # Parse time string
    try:
        start_time = datetime.strptime(schedule.start_time, "%Y-%m-%d %I:%M %p")
        start_time = start_time.replace(tzinfo=IST)
    except ValueError:
        raise HTTPException(
            400,
            "Invalid time format. Use: YYYY-MM-DD HH:MM AM/PM"
        )
    
    exam_service.schedule_exam(
        schedule.student_id,
        start_time,
        schedule.duration_minutes
    )
    
    return {
        "message": "Exam scheduled successfully",
        "student_id": schedule.student_id,
        "start_time": start_time.isoformat(),
        "duration": schedule.duration_minutes
    }

@router.get("/results/{exam_id}", response_model=GradingResult)
def get_exam_results(
    exam_id: str,
    user: dict = Depends(require_role("instructor"))
):
    """Get grading results for a specific exam"""
    if exam_id not in exam_service.active_exams:
        raise HTTPException(404, "Exam not found")
    
    exam = exam_service.active_exams[exam_id]
    
    if exam['status'] != 'completed':
        raise HTTPException(400, "Exam not yet completed")
    
    # Calculate scores (simplified - would use ML model)
    total_questions = len([r for r in exam.get('transcript', []) if r.get('role') == 'assistant'])
    total_score = min(20, total_questions * 2)  # Max 20 points
    
    avg_cheat_score = sum(r['cheat_score'] for r in exam['responses']) / len(exam['responses'])
    
    return GradingResult(
        student_id=exam['student_id'],
        total_score=total_score,
        scores={
            "technical_knowledge": total_score * 0.4,
            "problem_solving": total_score * 0.3,
            "communication": total_score * 0.3
        },
        strengths=["Good technical understanding", "Clear communication"],
        weaknesses=["Could elaborate more on edge cases"],
        feedback="Solid performance overall.",
        risk_level=exam.get('risk_level', 'LOW'),
        suspicion_score=avg_cheat_score,
        cheat_flags=exam.get('cheat_indicators', [])
    )

@router.get("/dashboard")
def instructor_dashboard(user: dict = Depends(require_role("instructor"))):
    """Get instructor dashboard data"""
    scheduled_exams = [
        {
            "student_id": sid,
            "student_name": exam_service.students[sid]['name'],
            "start_time": schedule['start_time'].isoformat(),
            "duration": schedule['duration_minutes']
        }
        for sid, schedule in exam_service.exam_schedules.items()
        if schedule['end_time'] > datetime.now(IST)
    ]
    
    completed_exams = [
        {
            "exam_id": eid,
            "student_id": exam['student_id'],
            "completed_at": exam.get('completed_at', '').isoformat() if hasattr(exam.get('completed_at', ''), 'isoformat') else ''
        }
        for eid, exam in exam_service.active_exams.items()
        if exam['status'] == 'completed'
    ]
    
    return {
        "total_students": len(exam_service.students),
        "scheduled_exams": scheduled_exams,
        "completed_exams": completed_exams,
        "pending_grading": len([e for e in exam_service.active_exams.values() if e['status'] == 'completed'])
    }