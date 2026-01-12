from typing import List, Dict, Optional
import os
from groq import Groq
from dotenv import load_dotenv

# Load .env from exam_system folder (2 levels up)
load_dotenv("../../.env")

class GrokExamService:
    """Real AI Exam Service using Groq API for dynamic question generation"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        
        if not self.api_key:
            print("⚠️ WARNING: GROQ_API_KEY not found in environment variables!")
            print("Falling back to mock mode with static questions.")
            self.mock_mode = True
            self.client = None
        else:
            try:
                self.client = Groq(api_key=self.api_key)
                self.mock_mode = False
                print("✅ Groq API initialized successfully")
            except Exception as e:
                print(f"⚠️ Error initializing Groq API: {e}")
                print("Falling back to mock mode with static questions.")
                self.mock_mode = True
                self.client = None
        
        self.conversations: Dict[str, List[Dict]] = {}
        self.model = "llama-3.1-8b-instant"  # Updated working model
        
        self.fallback_questions = [
            "Can you explain the technical architecture of your system?",
            "What were the main challenges you faced during development?",
            "How did you approach the design of your system?",
            "What technologies did you use and why?",
            "How did you measure the success of your project?",
            "Can you describe your testing strategy?",
            "What would you do differently if you started over?",
            "How would you scale this project for production?",
            "What security considerations did you implement?",
            "Tell me about a technical trade-off you had to make.",
        ]
        
    def start_exam(self, student_id: str, project_details: Dict) -> str:
        system_prompt = f"""You are an experienced professor conducting an oral examination for a student's project.

Project Details:
- Title: {project_details['title']}
- Description: {project_details['description']}
- Technologies: {', '.join(project_details['technologies'])}
- Metrics: {', '.join(project_details.get('metrics', []))}

Start by greeting the student and asking them to introduce their project briefly."""
        
        self.conversations[student_id] = [
            {"role": "system", "content": system_prompt}
        ]
        
        if not self.mock_mode and self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=self.conversations[student_id],
                    temperature=0.7,
                    max_tokens=150
                )
                greeting = response.choices[0].message.content.strip()
            except Exception:
                greeting = "Hello! Please introduce yourself and your project."
        else:
            greeting = "Hello! Please introduce yourself and your project."
        
        self.conversations[student_id].append({
            "role": "assistant",
            "content": greeting
        })
        
        return greeting
    
    def process_answer(self, student_id: str, answer: str, response_time: float) -> Dict:
        if student_id not in self.conversations:
            raise ValueError("Exam not started for this student")
        
        self.conversations[student_id].append({
            "role": "user",
            "content": answer
        })
        
        question_count = len([m for m in self.conversations[student_id] if m["role"] == "assistant"])
        
        if question_count >= 12:
            closing = "Thank you. Do you have any final thoughts about your project?"
            self.conversations[student_id].append({"role": "assistant", "content": closing})
            return {
                "next_question": closing,
                "question_number": question_count,
                "difficulty_level": 5
            }
        
        if not self.mock_mode and self.client:
            try:
                messages = self.conversations[student_id].copy()
                messages.append({
                    "role": "system",
                    "content": "Ask one concise technical follow-up question."
                })
                
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.8,
                    max_tokens=150
                )
                next_question = response.choices[0].message.content.strip()
            except Exception:
                next_question = self.fallback_questions[min(question_count-1, len(self.fallback_questions)-1)]
        else:
            next_question = self.fallback_questions[min(question_count-1, len(self.fallback_questions)-1)]
        
        self.conversations[student_id].append({
            "role": "assistant",
            "content": next_question
        })
        
        difficulty = min(5, (question_count // 2) + 1)
        
        return {
            "next_question": next_question,
            "question_number": question_count,
            "difficulty_level": difficulty
        }
    
    def get_conversation_transcript(self, student_id: str) -> List[Dict]:
        if student_id not in self.conversations:
            return []
        
        return [m for m in self.conversations[student_id] if m["role"] in ["user", "assistant"]]
    
    def end_exam(self, student_id: str) -> Dict:
        transcript = self.get_conversation_transcript(student_id)
        
        if student_id in self.conversations:
            del self.conversations[student_id]
        
        return {
            "transcript": transcript,
            "total_questions": len([m for m in transcript if m["role"] == "assistant"]),
            "total_answers": len([m for m in transcript if m["role"] == "user"])
        }
