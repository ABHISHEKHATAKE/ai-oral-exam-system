from typing import Dict, List
from datetime import datetime, timedelta
from app.core.security import IST
from app.services.cheat_detector import CheatDetector
from app.services.grok_service import GrokExamService

class ExamService:
    def __init__(self):
        self.students: Dict = {}
        self.exam_schedules: Dict = {}
        self.active_exams: Dict = {}
        self.cheat_detector = CheatDetector()
        self.grok_service = GrokExamService()

    def register_student(self, student_data: Dict):
        """Register a new student"""
        self.students[student_data['student_id']] = student_data
    
    def schedule_exam(self, student_id: str, start_time: datetime, duration_minutes: int):
        """Schedule an exam for a student"""
        end_time = start_time + timedelta(minutes=duration_minutes)
        
        self.exam_schedules[student_id] = {
            "start_time": start_time,
            "end_time": end_time,
            "duration_minutes": duration_minutes
        }
    
    def can_start_exam(self, student_id: str) -> tuple[bool, str]:
        """Check if student can start exam now"""
        if student_id not in self.exam_schedules:
            return False, "Exam not scheduled"
        
        now = datetime.now(IST)
        schedule = self.exam_schedules[student_id]
        
        if now < schedule['start_time']:
            return False, "Exam has not started yet"
        
        if now > schedule['end_time']:
            return False, "Exam window has closed"
        
        # Check if already in progress
        for exam in self.active_exams.values():
            if exam['student_id'] == student_id and exam['status'] == 'in_progress':
                return False, "Exam already in progress"
        
        return True, "OK"
    
    def start_exam(self, student_id: str) -> Dict:
        """Start a new exam session"""
        exam_id = f"exam_{student_id}_{int(datetime.now(IST).timestamp())}"
        
        student = self.students[student_id]
        
        # Initialize Grok conversation
        first_question = self.grok_service.start_exam(
            student_id,
            student['project_details']
        )
        
        self.active_exams[exam_id] = {
            "exam_id": exam_id,
            "student_id": student_id,
            "start_time": datetime.now(IST),
            "status": "in_progress",
            "responses": [],
            "cheat_indicators": []
        }
        
        return {
            "exam_id": exam_id,
            "first_question": first_question,
            "student_name": student['name']
        }
    
    def process_answer(self, exam_id: str, answer: str, response_time: float) -> Dict:
        """Process student answer and get next question"""
        exam = self.active_exams[exam_id]
        student_id = exam['student_id']
        
        # Get next question from Grok
        grok_response = self.grok_service.process_answer(student_id, answer, response_time)
        
        # Analyze for cheating
        cheat_analysis = self.cheat_detector.analyze_response(
            question="",  # Previous question would be tracked
            answer=answer,
            response_time=response_time,
            question_difficulty=grok_response['difficulty_level']
        )
        
        # Store response data
        exam['responses'].append({
            "answer": answer,
            "response_time": response_time,
            "timestamp": datetime.now(IST).isoformat(),
            "cheat_score": cheat_analysis['suspicion_score']
        })
        
        if cheat_analysis['flags']:
            exam['cheat_indicators'].extend(cheat_analysis['flags'])
        
        return {
            "next_question": grok_response['next_question'],
            "question_number": grok_response['question_number']
        }
    
    def end_exam(self, exam_id: str) -> Dict:
        """Complete exam and generate grading"""
        exam = self.active_exams[exam_id]
        student_id = exam['student_id']
        
        # Get full transcript from Grok
        exam_data = self.grok_service.end_exam(student_id)
        
        # Calculate cheat score
        total_cheat_score = sum(r['cheat_score'] for r in exam['responses'])
        avg_cheat_score = total_cheat_score / len(exam['responses']) if exam['responses'] else 0
        
        # Determine risk level
        if avg_cheat_score >= 6:
            risk_level = "HIGH"
        elif avg_cheat_score >= 3:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        exam['status'] = 'completed'
        exam['completed_at'] = datetime.now(IST)
        exam['transcript'] = exam_data['transcript']
        
        return {
            "exam_id": exam_id,
            "student_id": student_id,
            "total_questions": exam_data['total_questions'],
            "suspicion_score": avg_cheat_score,
            "risk_level": risk_level,
            "cheat_flags": list(set(exam['cheat_indicators']))
        }

# Global instance
exam_service = ExamService()