// src/components/IncidentForm.js
import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers";
import "./IncidentForm.css"
const IncidentForm = () => {
  const [formData, setFormData] = useState({
    incidentType: '',
    description: '',
    location: '',
    evidence: '',
    contactInfo: '',
    isAnonymous: false
  });
  
  const [reportId, setReportId] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState("");
  const [adminAddress, setAdminAddress] = useState("");

  useEffect(() => {
  const initialize = async () => {
    try {
      console.log("🔄 Initializing Web3...");
      const web3Instance = await getWeb3();
      setWeb3(web3Instance);

      console.log("✅ Web3 initialized:", web3Instance);

      const accounts = await web3Instance.eth.getAccounts();
      setAccounts(accounts);
      console.log("✅ Accounts:", accounts);

      const { instance } = await getContract(web3Instance);
      
      if (!instance) {
        console.error("❌ getContract() returned null!");
        return;
      }

      setContract(instance);
      console.log("✅ Contract successfully initialized:", instance);

      const admin = await instance.methods.admin().call();
      setAdminAddress(admin);
    } catch (error) {
      console.error("❌ Failed to load web3, accounts, or contract:", error);
      setError("Failed to load blockchain connection. Check console for details.");
    } finally {
      
    }
  };

  initialize();
}, []);


  if (error) return <div className="error">{error}</div>;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contract) {
      console.error("❌ Contract is not initialized!");
      alert("Blockchain connection error. Please try again.");
      return;
    }
  
    // ✅ Log contract details for debugging
    console.log("✅ Contract instance:", contract);
    console.log("✅ Available contract methods:", contract?.methods);
  
    try {
      const dataDetails = JSON.stringify({
        description: formData.description,
        evidence: formData.evidence,
        contactInfo: formData.contactInfo,
        timestamp: new Date().toISOString()
      });
  
      const dataHash = keccak256(toUtf8Bytes(dataDetails));
      console.log("Generated data hash:", dataHash);
  
      console.log("Submitting to blockchain...");
      const result = await contract.methods.fileReport(
        dataHash,
        formData.location,
        formData.incidentType,
        formData.isAnonymous
      ).send({ from: accounts[0] });
  
      console.log("Blockchain transaction result:", result);
  
      if (result.events && result.events.ReportFiled) {
        const reportIdFromEvent = result.events.ReportFiled.returnValues.reportId;
        console.log("Extracted Report ID:", reportIdFromEvent);
        setReportId(reportIdFromEvent);
      } else {
        console.error("Transaction completed but event missing.");
      }
  
      setFormData({
        incidentType: '',
        description: '',
        location: '',
        evidence: '',
        contactInfo: '',
        isAnonymous: false
      });
  
    } catch (error) {
      console.error(" Error submitting report:", error);
      alert("Error submitting report: " + error.message);
    } finally {
     
    }
  };
  
  return (
    <div className="form-container">
      <h2>Submit Incident Report</h2>
      {reportId && (
        <div className="success-message">
          Report submitted successfully! Report ID: {reportId}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="incidentType">Incident Type</label>
          <select
            id="incidentType"
            name="incidentType"
            value={formData.incidentType}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Type --</option>
            <option value="theft">Theft</option>
            <option value="assault">Assault</option>
            <option value="fraud">Fraud</option>
            <option value="vandalism">Vandalism</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="evidence">Evidence Description</label>
          <textarea
            id="evidence"
            name="evidence"
            value={formData.evidence}
            onChange={handleChange}
            rows="2"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="contactInfo">Contact Information</label>
          <input
            type="text"
            id="contactInfo"
            name="contactInfo"
            value={formData.contactInfo}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              name="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleChange}
            />
            Submit Anonymously
          </label>
        </div>
        
        <button type="submit" className="submit-btn">
          Submit Report
        </button>
      </form>
    </div>
  );
};

export default IncidentForm;
