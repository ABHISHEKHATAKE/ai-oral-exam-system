import React, { useState } from 'react';
import { api } from '../../services/api';

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.login(formData.username, formData.password);
        if (data.access_token) {
          onLogin(data.access_token);
        } else {
          setError('Invalid credentials');
        }
      } else {
        const data = await api.signup(formData);
        if (data.message) {
          setError('✅ Account created! Please login.');
          setIsLogin(true);
        } else {
          setError(data.detail || 'Signup failed');
        }
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" 
         style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            {/* Logo */}
            <div className="text-center mb-4">
              <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                   style={{ width: '80px', height: '80px' }}>
                <span style={{ fontSize: '40px' }}>🎓</span>
              </div>
              <h1 className="text-white fw-bold mb-2">AI Exam System</h1>
              <p className="text-white-50">Next-generation oral examination platform</p>
            </div>

            {/* Auth Card */}
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-4">
                {/* Tabs */}
                <div className="btn-group w-100 mb-4" role="group">
                  <button
                    className={`btn ${isLogin ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setIsLogin(true)}
                  >
                    Login
                  </button>
                  <button
                    className={`btn ${!isLogin ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setIsLogin(false)}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">📧 Email</label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">🔒 Password</label>
                    <input
                      type="password"
                      className="form-control form-control-lg"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  {!isLogin && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">👤 I am a...</label>
                      <select
                        className="form-select form-select-lg"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                      </select>
                    </div>
                  )}

                  {error && (
                    <div className={`alert ${error.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;