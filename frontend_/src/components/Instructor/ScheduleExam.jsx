import React, { useState } from 'react';
import { api } from '../../services/api';

function ScheduleExam({ token, students, onScheduled }) {
  const [formData, setFormData] = useState({
    student_id: '',
    start_time: '',
    duration_minutes: 30
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.scheduleExam(token, formData);
      alert('✅ Exam scheduled successfully!');
      setFormData({ student_id: '', start_time: '', duration_minutes: 30 });
      onScheduled();
    } catch (err) {
      alert('❌ Failed to schedule exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-6">
        <div className="card border-0 shadow-lg">
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">📅 Schedule New Exam</h4>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Select Student</label>
                <select
                  className="form-select form-select-lg"
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                  required
                >
                  <option value="">Choose a student...</option>
                  {students.map((student, idx) => (
                    <option key={idx} value={student.student_id}>
                      {student.name} ({student.student_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Start Time (Indian Time - Format: YYYY-MM-DD HH:MM AM/PM)
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  placeholder="2026-01-15 10:00 AM"
                  required
                />
                <small className="text-muted">Example: 2026-01-15 02:30 PM</small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Duration (minutes)</label>
                <input
                  type="number"
                  className="form-control form-control-lg"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                  min="10"
                  max="120"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100"
                disabled={loading}
              >
                {loading ? 'Scheduling...' : 'Schedule Exam'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleExam;