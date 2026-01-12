import React, { useState, useEffect } from 'react';
import Header from '../Common/Header';
import StudentProfile from './StudentProfile';
import TakeExam from './TakeExam';
import StudentResults from './StudentResults';
import { api } from '../../services/api';

function StudentDashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await api.getStudentDashboard(token);
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    }
  };

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'exam', label: '📝 Take Exam', icon: '📝' },
    { id: 'results', label: '🏆 Results', icon: '🏆' },
    { id: 'profile', label: '👤 Profile', icon: '👤' }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Header user={user} onLogout={onLogout} type="student" />

      <div className="container mt-4">
        {/* Navigation Tabs */}
        <ul className="nav nav-pills nav-fill bg-white rounded-3 shadow-sm p-2 mb-4">
          {tabs.map(tab => (
            <li className="nav-item" key={tab.id}>
              <button
                className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#6c757d',
                  border: 'none',
                  fontWeight: '600'
                }}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Tab Content */}
        {activeTab === 'dashboard' && dashboardData && (
          <DashboardView data={dashboardData} />
        )}
        {activeTab === 'exam' && (
          <TakeExam token={token} dashboardData={dashboardData} />
        )}
        {activeTab === 'results' && (
          <StudentResults token={token} />
        )}
        {activeTab === 'profile' && (
          <StudentProfile token={token} onProfileCreated={() => {
            fetchDashboard();
            setActiveTab('dashboard');
          }} />
        )}
      </div>
    </div>
  );
}

function DashboardView({ data }) {
  return (
    <div>
      {/* Welcome Banner */}
      <div className="card border-0 shadow-lg mb-4"
           style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card-body p-4 text-white">
          <h2 className="mb-2">Welcome, {data.name || 'Student'}! 👋</h2>
          <p className="mb-0 opacity-75">Ready to showcase your knowledge and ace your exams?</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm border-start border-primary border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 fw-semibold">Upcoming Exams</p>
                  <h3 className="mb-0">{data.upcoming_exams?.length || 0}</h3>
                </div>
                <div style={{ fontSize: '40px' }}>📅</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm border-start border-success border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 fw-semibold">Completed</p>
                  <h3 className="mb-0">{data.past_results?.length || 0}</h3>
                </div>
                <div style={{ fontSize: '40px' }}>✅</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm border-start border-info border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 fw-semibold">Profile Status</p>
                  <h5 className="mb-0">
                    {data.profile_complete ? '✅ Complete' : '⚠️ Pending'}
                  </h5>
                </div>
                <div style={{ fontSize: '40px' }}>👤</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Exams */}
      {data.upcoming_exams && data.upcoming_exams.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0">
            <h5 className="mb-0 fw-bold">⏰ Upcoming Examinations</h5>
          </div>
          <div className="card-body">
            {data.upcoming_exams.map((exam, idx) => (
              <div key={idx} className="alert alert-primary border-start border-primary border-4 mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1 fw-bold">AI Oral Examination</h6>
                    <small className="text-muted">
                      📅 {new Date(exam.start_time).toLocaleString()} • {exam.duration} minutes
                    </small>
                  </div>
                  <span className="badge bg-primary rounded-pill">Scheduled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;