import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

function ViewResults({ token }) {
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examResult, setExamResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllResults();
  }, []);

  const fetchAllResults = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/instructor/results', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllResults(data.results || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewDetailedResult = async (examId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/instructor/results/${examId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExamResult(data);
        setSelectedExam(examId);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Filter results by search term
  const filteredResults = allResults.filter(result => 
    result.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.exam_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary"></div>
        <p className="mt-3 text-muted">Loading results...</p>
      </div>
    );
  }

  // Detailed result view
  if (examResult && selectedExam) {
    return (
      <div>
        <button
          className="btn btn-secondary mb-3"
          onClick={() => { setSelectedExam(null); setExamResult(null); }}
        >
          ← Back to All Results
        </button>

        <div className="card border-0 shadow-lg border-start border-primary border-4">
          <div className="card-body p-4">
            <h3 className="fw-bold mb-4">📊 Detailed Exam Results</h3>

            <div className="row mb-4">
              <div className="col-md-4">
                <p className="text-muted mb-1">Student ID</p>
                <h5 className="fw-bold">{examResult.student_id}</h5>
              </div>
              <div className="col-md-4">
                <p className="text-muted mb-1">Exam ID</p>
                <h6 className="text-muted">{selectedExam}</h6>
              </div>
              <div className="col-md-4 text-end">
                <p className="text-muted mb-1">Total Score</p>
                <h2 className="text-primary fw-bold">{examResult.total_score}/20</h2>
              </div>
            </div>

            <div className="row g-3 mb-4">
              {Object.entries(examResult.scores).map(([key, value]) => (
                <div key={key} className="col-md-4">
                  <div className="card bg-light border-0">
                    <div className="card-body text-center">
                      <small className="text-uppercase text-muted d-block mb-1">
                        {key.replace('_', ' ')}
                      </small>
                      <h4 className="mb-0 fw-bold">{value.toFixed(1)}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {examResult.strengths && examResult.strengths.length > 0 && (
              <div className="mb-4">
                <h6 className="fw-bold">💪 Strengths:</h6>
                <ul className="list-group">
                  {examResult.strengths.map((s, i) => (
                    <li key={i} className="list-group-item border-0 bg-light">
                      ✓ {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {examResult.weaknesses && examResult.weaknesses.length > 0 && (
              <div className="mb-4">
                <h6 className="fw-bold">📈 Areas for Improvement:</h6>
                <ul className="list-group">
                  {examResult.weaknesses.map((w, i) => (
                    <li key={i} className="list-group-item border-0 bg-light">
                      • {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="alert alert-info">
              <strong>📝 Feedback:</strong> {examResult.feedback}
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <span className={`badge ${
                examResult.risk_level === 'LOW' ? 'bg-success' :
                examResult.risk_level === 'MEDIUM' ? 'bg-warning' :
                'bg-danger'
              } rounded-pill px-3 py-2`}>
                {examResult.risk_level} RISK
              </span>
              <small className="text-muted">
                Suspicion Score: {examResult.suspicion_score}/10
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // All results list view
  if (allResults.length === 0) {
    return (
      <div className="card border-0 shadow-sm text-center p-5">
        <div style={{ fontSize: '64px' }}>📝</div>
        <h4 className="mt-3">No Completed Exams</h4>
        <p className="text-muted">Results will appear here after students complete exams</p>
        <button className="btn btn-primary mt-3" onClick={fetchAllResults}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">🏆 All Exam Results</h3>
        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '250px' }}
          />
          <button className="btn btn-outline-primary" onClick={fetchAllResults}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Student</th>
                  <th>Exam ID</th>
                  <th>Score</th>
                  <th>Questions</th>
                  <th>Risk</th>
                  <th>Completed</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result, idx) => (
                  <tr key={idx}>
                    <td>
                      <div>
                        <strong>{result.student_name}</strong>
                        <br />
                        <small className="text-muted">{result.student_id}</small>
                      </div>
                    </td>
                    <td>
                      <small className="font-monospace">{result.exam_id}</small>
                    </td>
                    <td>
                      <strong className="text-primary">
                        {result.total_score}/{result.max_score}
                      </strong>
                      <br />
                      <small className="text-muted">
                        {result.percentage.toFixed(1)}%
                      </small>
                    </td>
                    <td>{result.total_questions}</td>
                    <td>
                      <span className={`badge ${
                        result.risk_level === 'LOW' ? 'bg-success' :
                        result.risk_level === 'MEDIUM' ? 'bg-warning' :
                        'bg-danger'
                      }`}>
                        {result.risk_level}
                      </span>
                    </td>
                    <td>
                      <small>{new Date(result.completed_at).toLocaleDateString()}</small>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => viewDetailedResult(result.exam_id)}
                      >
                        👁️ View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-3 text-muted">
        <small>Showing {filteredResults.length} of {allResults.length} results</small>
      </div>
    </div>
  );
}

export default ViewResults;