// src/components/IncidentViewer.js
import React, { useState } from 'react';

const IncidentViewer = ({ contract }) => {
  const [reportId, setReportId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setReportId(e.target.value);
  };

  const fetchReport = async () => {
    if (!reportId || reportId <= 0) {
      setError('Please enter a valid report ID');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const reportData = await contract.methods.getReport(reportId).call();
      setReport(reportData);
    } catch (error) {
      console.error("Error fetching report:", error);
      setError('Error fetching report: ' + error.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels = ["Reported", "Under Investigation", "Resolved", "Closed"];

  return (
    <div className="viewer-container">
      <h2>View Incident Report</h2>
      
      <div className="search-section">
        <div className="form-group">
          <label htmlFor="reportId">Report ID</label>
          <input
            type="number"
            id="reportId"
            value={reportId}
            onChange={handleChange}
            min="1"
          />
          <button onClick={fetchReport} disabled={loading} className="view-btn">
            {loading ? 'Loading...' : 'View Report'}
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
      </div>
      
      {report && (
        <div className="report-details">
          <h3>Report #{report.id}</h3>
          <table>
            <tbody>
              <tr>
                <td>Type:</td>
                <td>{report.incidentType}</td>
              </tr>
              <tr>
                <td>Date:</td>
                <td>{new Date(report.timestamp * 1000).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Status:</td>
                <td>{statusLabels[parseInt(report.status)]}</td>
              </tr>
              <tr>
                <td>Location:</td>
                <td>{report.location}</td>
              </tr>
              <tr>
                <td>Reporter:</td>
                <td>{report.isAnonymous ? 'Anonymous' : report.reporter}</td>
              </tr>
              <tr>
                <td>Data Hash:</td>
                <td className="hash">{report.incidentHash}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IncidentViewer;
