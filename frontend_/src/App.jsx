import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './components/Auth/Login';
import StudentDashboard from './components/Student/StudentDashboard';
import InstructorDashboard from './components/Instructor/InstructorDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ email: payload.sub, role: payload.role });
      } catch (e) {
        localStorage.removeItem('token');
        setToken(null);
      }
    }
  }, [token]);

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      {user.role === 'instructor' ? (
        <InstructorDashboard user={user} token={token} onLogout={handleLogout} />
      ) : (
        <StudentDashboard user={user} token={token} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;