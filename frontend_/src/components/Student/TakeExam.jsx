import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';

function TakeExam({ token, dashboardData, user }) {
  const [examStarted, setExamStarted] = useState(false);
  const [examId, setExamId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startExam = async () => {
    setLoading(true);
    setError('');

    try {
      // Get student_id from dashboard or generate from email
      let studentId = null;

      // Try to find student_id from dashboard
      if (dashboardData && dashboardData.name) {
        // Student already has profile, need to get student_id
        // Call API to get profile info
        const response = await fetch(`http://localhost:8000/api/student/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          // The backend should return student info
          // For now, we'll use a default or ask user
        }
      }

      // If no student_id found, prompt user
      if (!studentId) {
        studentId = prompt('Please enter your Student ID (e.g., S12345):');
        if (!studentId) {
          setError('Student ID is required to start exam');
          setLoading(false);
          return;
        }
      }

      const data = await api.startExam(token, studentId);
      
      if (data.exam_id) {
        setExamId(data.exam_id);
        setExamStarted(true);
        connectWebSocket(data.exam_id);
      } else {
        setError(data.detail || 'Could not start exam');
      }
    } catch (err) {
      setError('Error starting exam. Please check if exam is scheduled and profile is complete.');
      console.error('Start exam error:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = (examId) => {
    const ws = new WebSocket(`ws://localhost:8000/api/exams/ws/${examId}?token=${token}&mode=text`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'question') {
        setMessages(prev => [...prev, { role: 'ai', content: data.content }]);
        setQuestionStartTime(Date.now());
      } else if (data.type === 'exam_complete') {
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: '🎉 Exam completed! Check your results in the Results tab.' 
        }]);
        setTimeout(() => {
          ws.close();
          setExamStarted(false);
        }, 2000);
      } else if (data.error) {
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: `❌ Error: ${data.error}` 
        }]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Please refresh and try again.');
    };

    wsRef.current = ws;
  };

  const sendAnswer = () => {
    if (!currentAnswer.trim() || !wsRef.current) return;

    const responseTime = (Date.now() - questionStartTime) / 1000;
    
    wsRef.current.send(JSON.stringify({
      type: 'answer',
      mode: 'text',
      content: currentAnswer,
      response_time: responseTime
    }));

    setMessages(prev => [...prev, { role: 'student', content: currentAnswer }]);
    setCurrentAnswer('');
  };

  const endExam = () => {
    if (window.confirm('Are you sure you want to end the exam?')) {
      wsRef.current?.send(JSON.stringify({ type: 'end_exam' }));
    }
  };

  if (!examStarted) {
    return (
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card border-0 shadow-lg">
            <div className="card-body text-center p-5">
              <div className="mb-4" style={{ fontSize: '64px' }}>📚</div>
              <h3 className="fw-bold mb-3">Ready for Your Exam?</h3>
              <p className="text-muted mb-4">
                This is an <strong className="text-primary">AI-proctored oral examination</strong>. 
                You'll have a conversation with our intelligent AI examiner about your project.
              </p>

              {error && (
                <div className="alert alert-danger">
                  <strong>❌ Error:</strong> {error}
                </div>
              )}

              {dashboardData && !dashboardData.profile_complete && (
                <div className="alert alert-warning">
                  <strong>⚠️ Warning:</strong> Please complete your profile first!
                </div>
              )}

              {dashboardData && dashboardData.upcoming_exams && dashboardData.upcoming_exams.length === 0 && (
                <div className="alert alert-info">
                  <strong>ℹ️ Info:</strong> No exam scheduled yet. Please wait for your instructor to schedule an exam.
                </div>
              )}

              <div className="alert alert-info">
                <strong>💡 Tip:</strong> Make sure:
                <ul className="text-start mt-2 mb-0">
                  <li>Your profile is complete</li>
                  <li>Exam is scheduled by instructor</li>
                  <li>Current time is within exam window</li>
                  <li>You know your Student ID</li>
                </ul>
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={startExam}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Starting...
                  </>
                ) : (
                  '▶️ Start Exam Now'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-lg-10">
        <div className="card border-0 shadow-lg">
          <div className="card-header text-white p-3"
               style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <span className="me-2" style={{ fontSize: '32px' }}>🤖</span>
                <div>
                  <h6 className="mb-0 fw-bold">AI Examiner</h6>
                  <small className="opacity-75">🟢 Online</small>
                </div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={endExam}>
                ⏹️ End Exam
              </button>
            </div>
          </div>

          <div className="card-body bg-light" style={{ height: '500px', overflowY: 'auto' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`d-flex mb-3 ${msg.role === 'student' ? 'justify-content-end' : 'justify-content-start'}`}>
                <div
                  className={`p-3 rounded-3 ${
                    msg.role === 'ai' ? 'bg-white shadow-sm' :
                    msg.role === 'student' ? 'text-white' :
                    'bg-success text-white text-center w-100'
                  }`}
                  style={{
                    maxWidth: '70%',
                    background: msg.role === 'student' 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : undefined
                  }}
                >
                  {msg.role === 'ai' && (
                    <small className="text-primary fw-semibold d-block mb-1">AI Examiner</small>
                  )}
                  <p className="mb-0">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="card-footer bg-white p-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control form-control-lg"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendAnswer()}
                placeholder="Type your answer here..."
              />
              <button className="btn btn-primary" onClick={sendAnswer}>
                ➤ Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TakeExam;