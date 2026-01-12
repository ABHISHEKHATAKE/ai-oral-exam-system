from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class SignUp(BaseModel):
    username: EmailStr
    password: str
    role: str  # "instructor" or "student"

class StudentProfile(BaseModel):
    student_id: str
    name: str
    email: EmailStr
    project_title: str
    project_description: str
    technologies: List[str]
    metrics: List[str]
    case_study: str

class ExamSchedule(BaseModel):
    student_id: str
    start_time: str  # Format: "YYYY-MM-DD HH:MM AM/PM"
    duration_minutes: int

class ExamRequest(BaseModel):
    student_id: str

class ExamResponse(BaseModel):
    exam_id: str
    student_id: str
    student_name: str
    status: str
    created_at: str

class GradingResult(BaseModel):
    student_id: str
    total_score: float
    scores: Dict[str, float]
    strengths: List[str]
    weaknesses: List[str]
    feedback: str
    risk_level: str
    suspicion_score: float
    cheat_flags: List[str]

class StudentDetailResponse(BaseModel):
    student_id: str
    name: str
    email: str
    project_details: Dict
    case_study: str

class DashboardResponse(BaseModel):
    name: str
    upcoming_exams: List[Dict]
    past_results: List[Dict]
    profile_complete: bool