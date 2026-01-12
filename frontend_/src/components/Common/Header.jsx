import React from 'react';

function Header({ user, onLogout, type = 'student' }) {
  const bgColor = type === 'student' ? '#667eea' : '#764ba2';

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-bottom"
         style={{ borderBottom: `4px solid ${bgColor}` }}>
      <div className="container-fluid">
        <div className="d-flex align-items-center">
          <div className="rounded-3 p-2 me-3"
               style={{ background: `linear-gradient(135deg, ${bgColor} 0%, #764ba2 100%)` }}>
            <span className="text-white" style={{ fontSize: '24px' }}>
              {type === 'student' ? '🎓' : '👨‍🏫'}
            </span>
          </div>
          <div>
            <h5 className="mb-0 fw-bold">
              {type === 'student' ? 'Student Portal' : 'Instructor Portal'}
            </h5>
            <small className="text-muted">{user.email}</small>
          </div>
        </div>
        <button className="btn btn-outline-danger" onClick={onLogout}>
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}

export default Header;