import React from 'react';

function StudentsList({ students }) {
  if (students.length === 0) {
    return (
      <div className="card border-0 shadow-sm text-center p-5">
        <div style={{ fontSize: '64px' }}>👥</div>
        <h4 className="mt-3">No Students Yet</h4>
        <p className="text-muted">Students will appear here once they register</p>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-0">
        <h4 className="mb-0 fw-bold">👥 Registered Students</h4>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Project Title</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr key={idx}>
                  <td>
                    <span className="badge bg-primary">{student.student_id}</span>
                  </td>
                  <td className="fw-semibold">{student.name}</td>
                  <td className="text-muted">{student.email}</td>
                  <td>{student.project_title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentsList;