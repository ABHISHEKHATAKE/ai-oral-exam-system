import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

function StudentProfile({ token, user, onProfileCreated }) {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    project_title: '',
    project_description: '',
    technologies: '',
    metrics: '',
    case_study: ''
  });

  // Try to get user info from multiple sources
  useEffect(() => {
    const loadUserInfo = () => {
      // Priority 1: user prop
      if (user?.email) {
        setUserInfo(user);
        setFormData(prev => ({ ...prev, email: user.email }));
        return;
      }

      // Priority 2: localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.email) {
            setUserInfo(parsedUser);
            setFormData(prev => ({ ...prev, email: parsedUser.email }));
            return;
          }
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }

      // Priority 3: Try to decode token
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.sub) {
            const userFromToken = { email: payload.sub };
            setUserInfo(userFromToken);
            setFormData(prev => ({ ...prev, email: payload.sub }));
            return;
          }
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }
    };

    loadUserInfo();
  }, [user, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate user info exists
    if (!userInfo || !userInfo.email) {
      alert('❌ Error: User information not available. Please log in again.');
      return;
    }
    
    setLoading(true);

    const payload = {
      student_id: formData.student_id.trim(),
      name: formData.name.trim(),
      email: userInfo.email,
      project_title: formData.project_title.trim(),
      project_description: formData.project_description.trim(),
      technologies: formData.technologies.split(',').map(t => t.trim()).filter(t => t),
      metrics: formData.metrics.split(',').map(m => m.trim()).filter(m => m),
      case_study: formData.case_study.trim()
    };

    // Debug: Log the payload
    console.log('Sending payload:', payload);

    try {
      const response = await api.createProfile(token, payload);
      console.log('Success response:', response);
      alert('✅ Profile created successfully!');
      if (onProfileCreated) {
        onProfileCreated();
      }
    } catch (err) {
      console.error('Error details:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.message 
        || err.message 
        || 'Unknown error occurred';
      
      alert('❌ Error creating profile: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        {!userInfo || !userInfo.email ? (
          <div className="card border-0 shadow-lg">
            <div className="card-body p-4">
              <div className="alert alert-warning">
                <h5>⚠️ User Information Missing</h5>
                <p>Trying to load user information...</p>
                <p className="mb-0"><strong>Debug Info:</strong></p>
                <ul>
                  <li>User prop: {user ? JSON.stringify(user) : 'null'}</li>
                  <li>Token exists: {token ? 'Yes' : 'No'}</li>
                  <li>Token preview: {token ? token.substring(0, 20) + '...' : 'N/A'}</li>
                </ul>
                <button 
                  className="btn btn-primary mt-2"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">👤 Create Your Profile</h4>
            </div>
            <div className="card-body p-4">
              <div className="alert alert-info mb-4">
                <strong>ℹ️ Note:</strong> Your email is automatically set to match your login email: <strong>{userInfo.email}</strong>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Student ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.student_id}
                      onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                      placeholder="S12345"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Email (Auto-filled) *</label>
                    <input
                      type="email"
                      className="form-control bg-light"
                      value={userInfo.email}
                      disabled
                      style={{ cursor: 'not-allowed' }}
                    />
                    <small className="text-muted">
                      This email is locked to your login email and cannot be changed.
                    </small>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Project Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.project_title}
                      onChange={(e) => setFormData({...formData, project_title: e.target.value})}
                      placeholder="AI Chatbot System"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Project Description *</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={formData.project_description}
                      onChange={(e) => setFormData({...formData, project_description: e.target.value})}
                      placeholder="Describe your project in detail..."
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Technologies (comma-separated) *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.technologies}
                      onChange={(e) => setFormData({...formData, technologies: e.target.value})}
                      placeholder="Python, FastAPI, React"
                      required
                    />
                    <small className="text-muted">Example: Python, TensorFlow, React</small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Metrics (comma-separated) *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.metrics}
                      onChange={(e) => setFormData({...formData, metrics: e.target.value})}
                      placeholder="Accuracy, Precision, Recall"
                      required
                    />
                    <small className="text-muted">Example: Accuracy, F1-Score</small>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Case Study *</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={formData.case_study}
                      onChange={(e) => setFormData({...formData, case_study: e.target.value})}
                      placeholder="Describe a real-world application or use case..."
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 mt-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating Profile...
                    </>
                  ) : (
                    'Create Profile'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentProfile;