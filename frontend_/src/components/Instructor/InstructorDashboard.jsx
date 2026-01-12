import React, { useState, useEffect } from 'react';
import Header from '../Common/Header';
import StudentsList from './StudentsList';
import ScheduleExam from './ScheduleExam';
import ViewResults from './ViewResults';
import { api } from '../../services/api';

function InstructorDashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchDashboard();
    fetchStudents();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await api.getInstructorDashboard(token);
      setDashboardData(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await api.getStudents(token);
      setStudents(data.students || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'students', label: '👥 Students' },
    { id: 'schedule', label: '📅 Schedule' },
    { id: 'results', label: '🏆 Results' }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Header user={user} onLogout={onLogout} type="instructor" />

      <div className="container mt-4">
        <ul className="nav nav-pills nav-fill bg-white rounded-3 shadow-sm p-2 mb-4">
          {tabs.map(tab => (
            <li className="nav-item" key={tab.id}>
              <button
                className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id 
                    ? 'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)'
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

        {activeTab === 'dashboard' && dashboardData && (
          <InstructorDashboardView data={dashboardData} />
        )}
        {activeTab === 'students' && (
          <StudentsList students={students} />
        )}
        {activeTab === 'schedule' && (
          <ScheduleExam token={token} students={students} onScheduled={fetchDashboard} />
        )}
        {activeTab === 'results' && (
          <ViewResults token={token} dashboard={dashboardData} />
        )}
      </div>
    </div>
  );
}

function InstructorDashboardView({ data }) {
  return (
    <div>
      <div className="card border-0 shadow-lg mb-4"
           style={{ background: 'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)' }}>
        <div className="card-body p-4 text-white">
          <h2 className="mb-2">Instructor Dashboard 👨‍🏫</h2>
          <p className="mb-0 opacity-75">Manage students and track exam performance</p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm border-start border-primary border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Total Students</p>
                  <h3 className="mb-0">{data.total_students}</h3>
                </div>
                <div style={{ fontSize: '40px' }}>👥</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm border-start border-info border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Scheduled</p>
                  <h3 className="mb-0">{data.scheduled_exams?.length || 0}</h3>
                </div>
                <div style={{ fontSize: '40px' }}>📅</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm border-start border-success border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Completed</p>
                  <h3 className="mb-0">{data.completed_exams?.length || 0}</h3>
                </div>
                <div style={{ fontSize: '40px' }}>✅</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm border-start border-warning border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Pending Grading</p>
                  <h3 className="mb-0">{data.pending_grading || 0}</h3>
                </div>
                <div style={{ fontSize: '40px' }}>📝</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstructorDashboard;