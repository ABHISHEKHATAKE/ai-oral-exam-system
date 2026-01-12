// src/services/api.js
const API_URL = "https://ai-oral-exam-system-9.onrender.com"

export const api = {
  // Auth
  signup: async (userData) => {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      throw new Error('Signup failed');
    }
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
    if (!response.ok) {
      throw new Error('Login failed');
    }
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
    if (!response.ok) {
      throw new Error('Profile creation failed');
    }
    return response.json();
  },

  getStudentDashboard: async (token) => {
    const response = await fetch(`${API_URL}/api/student/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard');
    }
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
    if (!response.ok) {
      throw new Error('Failed to start exam');
    }
    return response.json();
  },

  getStudentResults: async (token) => {
    const response = await fetch(`${API_URL}/api/student/results`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch results');
    }
    return response.json();
  },

  // Instructor APIs
  getInstructorDashboard: async (token) => {
    const response = await fetch(`${API_URL}/api/instructor/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard');
    }
    return response.json();
  },

  getStudents: async (token) => {
    const response = await fetch(`${API_URL}/api/instructor/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }
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
    if (!response.ok) {
      throw new Error('Failed to schedule exam');
    }
    return response.json();
  },

  getExamResult: async (token, examId) => {
    const response = await fetch(`${API_URL}/api/instructor/results/${examId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch result');
    }
    return response.json();
  },

  getAllResults: async (token) => {
    const response = await fetch(`${API_URL}/api/instructor/results`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch results');
    }
    return response.json();
  }
};

// Export API_URL for WebSocket connections
export { API_URL };