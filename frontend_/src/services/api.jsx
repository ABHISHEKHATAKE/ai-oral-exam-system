const API_URL = 'http://localhost:8000';

export const api = {
  // Auth
  signup: async (userData) => {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    return response.json();
  },

  // Student APIs
  createProfile: async (token, profileData) => {
    const response = await fetch(`${API_URL}/api/student/profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });
    return response.json();
  },

  getStudentDashboard: async (token) => {
    const response = await fetch(`${API_URL}/api/student/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  startExam: async (token, studentId) => {
    const response = await fetch(`${API_URL}/api/exams/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ student_id: studentId })
    });
    return response.json();
  },

  getStudentResults: async (token) => {
    const response = await fetch(`${API_URL}/api/student/results`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  // Instructor APIs
  getInstructorDashboard: async (token) => {
    const response = await fetch(`${API_URL}/api/instructor/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  getStudents: async (token) => {
    const response = await fetch(`${API_URL}/api/instructor/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  scheduleExam: async (token, scheduleData) => {
    const response = await fetch(`${API_URL}/api/instructor/schedule-exam`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scheduleData)
    });
    return response.json();
  },

  getExamResult: async (token, examId) => {
    const response = await fetch(`${API_URL}/api/instructor/results/${examId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
};