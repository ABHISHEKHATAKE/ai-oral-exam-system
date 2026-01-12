import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

function StudentResults({ token }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [detailedResult, setDetailedResult] = useState(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:8000/api/student/results', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to fetch results');
      }
    } catch (err) {
      setError('Connection error. Please check if the server is running.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewDetailedResult = async (examId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/student/results/${examId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDetailedResult(data);
        setSelectedExam(examId);
      } else {
        alert('Failed to fetch detailed results');
      }
    } catch (err) {
      alert('Error fetching detailed results');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading your results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h5 className="alert-heading">❌ Error</h5>
        <p>{error}</p>
        <button className="btn btn-sm btn-outline-danger" onClick={fetchResults}>
          Try Again
        </button>
      </div>
    );
  }

  // Detailed result view
  if (selectedExam && detailedResult) {
    return (
      <div>
        <button 
          className="btn btn-secondary mb-3"
          onClick={() => {
            setSelectedExam(null);
            setDetailedResult(null);
          }}
        >
          ← Back to All Results
        </button>

        <div className="card border-0 shadow-lg border-start border-primary border-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h3 className="fw-bold mb-1">📊 Detailed Exam Results</h3>
                <p className="text-muted mb-0">
                  <small>Exam ID: {detailedResult.exam_id}</small>
                </p>
              </div>
              <div className="text-end">
                <h2 className="text-primary fw-bold mb-0">
                  {detailedResult.total_score}/{detailedResult.max_score}
                </h2>
                <p className="text-muted mb-0">
                  {detailedResult.percentage.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="row g-3 mb-4">
              {Object.entries(detailedResult.scores).map(([key, value]) => (
                <div key={key} className="col-md-4">
                  <div className="card bg-light border-0">
                    <div className="card-body text-center">
                      <small className="text-muted text-uppercase fw-semibold d-block mb-1">
                        {key.replace('_', ' ')}
                      </small>
                      <h4 className="mb-0 fw-bold text-primary">{value.toFixed(1)}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <div className="card bg-info bg-opacity-10 border-0">
                  <div className="card-body">
                    <h6 className="fw-bold mb-2">📊 Statistics</h6>
                    <p className="mb-1">
                      <strong>Questions Asked:</strong> {detailedResult.total_questions}
                    </p>
                    <p className="mb-1">
                      <strong>Answers Given:</strong> {detailedResult.total_answers}
                    </p>
                    <p className="mb-0">
                      <strong>Completed:</strong> {new Date(detailedResult.completed_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card bg-success bg-opacity-10 border-0">
                  <div className="card-body">
                    <h6 className="fw-bold mb-2">🔍 Integrity Check</h6>
                    <p className="mb-1">
                      <strong>Risk Level:</strong> 
                      <span className={`badge ms-2 ${
                        detailedResult.risk_level === 'LOW' ? 'bg-success' :
                        detailedResult.risk_level === 'MEDIUM' ? 'bg-warning' :
                        'bg-danger'
                      }`}>
                        {detailedResult.risk_level}
                      </span>
                    </p>
                    <p className="mb-1">
                      <strong>Suspicion Score:</strong> {detailedResult.suspicion_score.toFixed(1)}/10
                    </p>
                    {detailedResult.cheat_flags && detailedResult.cheat_flags.length > 0 ? (
                      <small className="text-danger">
                        {detailedResult.cheat_flags.join(', ')}
                      </small>
                    ) : (
                      <small className="text-success">✅ No issues detected</small>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="alert alert-info mb-0">
              <h6 className="alert-heading">📝 Feedback</h6>
              <p className="mb-0">{detailedResult.feedback}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results list view
  if (results.length === 0) {
    return (
      <div className="card border-0 shadow-sm text-center p-5">
        <div style={{ fontSize: '64px' }}>🏆</div>
        <h4 className="mt-3">No Results Yet</h4>
        <p className="text-muted">Your exam results will appear here after you complete an exam.</p>
        <button className="btn btn-primary mt-3" onClick={fetchResults}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">📊 My Exam Results</h3>
        <button className="btn btn-outline-primary btn-sm" onClick={fetchResults}>
          🔄 Refresh
        </button>
      </div>

      <div className="row g-4">
        {results.map((result, idx) => (
          <div key={idx} className="col-12">
            <div className="card border-0 shadow-sm hover-shadow border-start border-primary border-4">
              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h5 className="fw-bold mb-2">
                      🏆 Oral Examination Result
                    </h5>
                    <p className="text-muted mb-2">
                      <small>
                        📅 Completed: {new Date(result.completed_at).toLocaleString()}
                      </small>
                    </p>
                    <p className="text-muted mb-0">
                      <small>
                        📝 Exam ID: {result.exam_id}
                      </small>
                    </p>
                  </div>
                  <div className="col-md-4 text-md-end mt-3 mt-md-0">
                    <h2 className="text-primary fw-bold mb-1">
                      {result.total_score}/{result.max_score}
                    </h2>
                    <p className="text-muted mb-2">
                      {result.percentage.toFixed(1)}% • {result.total_questions} Questions
                    </p>
                    <span className={`badge ${
                      result.risk_level === 'LOW' ? 'bg-success' :
                      result.risk_level === 'MEDIUM' ? 'bg-warning' :
                      'bg-danger'
                    } rounded-pill px-3 py-2`}>
                      {result.risk_level} RISK
                    </span>
                  </div>
                </div>

                <hr />

                <div className="row g-3">
                  {Object.entries(result.scores).map(([key, value]) => (
                    <div key={key} className="col-md-4">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <small className="text-muted text-uppercase d-block">
                            {key.replace('_', ' ')}
                          </small>
                          <strong className="text-primary">{value.toFixed(1)}</strong>
                        </div>
                        <div className="progress flex-grow-1 ms-2" style={{ height: '8px' }}>
                          <div 
                            className="progress-bar bg-primary" 
                            style={{ width: `${(value / 8) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    {result.feedback}
                  </small>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => viewDetailedResult(result.exam_id)}
                  >
                    👁️ View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentResults;