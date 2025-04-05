/*
  import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import OAuthPopup from 'react-oauth-popup';
import './WearableIntegration.css';

const FitbitIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebug, setShowDebug] = useState(false);
  
  // Emergency monitoring states
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [distressDetected, setDistressDetected] = useState(false);
  const [heartRateThreshold, setHeartRateThreshold] = useState(120);
  const [lastHeartRate, setLastHeartRate] = useState(null);
  const [monitoringStatus, setMonitoringStatus] = useState('inactive');
  const monitoringInterval = useRef(null);
  const alertSent = useRef(false);

  // Fitbit OAuth configuration
  const CLIENT_ID = '23QBVG';
  const REDIRECT_URI = 'http://localhost:5174/wearable';
  const FITBIT_AUTH_URL = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=activity heartrate&expires_in=604800`;
  
  // Your backend API URL
  const API_URL = 'http://localhost:5000/api';

  // Telegram Bot API configuration
  const TELEGRAM_BOT_TOKEN = '8038392267:AAExoT3gEZdhgWpdhRKpQktTkoyHeEC2MM8'; // Replace with your bot token
  const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  // Log debugging information
  const logDebug = (key, value) => {
    console.log(`[DEBUG] ${key}:`, value);
    setDebugInfo(prev => ({ ...prev, [key]: value, timestamp: new Date().toISOString() }));
  };

  // Test backend connection on component mount
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        logDebug('Testing backend connection', API_URL);
        const response = await axios.get(`${API_URL}/test`);
        logDebug('Backend connection test response', response.data);
      } catch (error) {
        logDebug('Backend connection test error', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        setError('Cannot connect to backend server. Please make sure it is running.');
      }
    };

    testBackendConnection();
    
    // Load emergency contacts from localStorage
    const savedContacts = localStorage.getItem('emergency_contacts');
    if (savedContacts) {
      setEmergencyContacts(JSON.parse(savedContacts));
    }
    
    // Load heart rate threshold from localStorage
    const savedThreshold = localStorage.getItem('heart_rate_threshold');
    if (savedThreshold) {
      setHeartRateThreshold(parseInt(savedThreshold, 10));
    }
    
    return () => {
      // Cleanup monitoring interval
      if (monitoringInterval.current) {
        clearInterval(monitoringInterval.current);
      }
    };
  }, [API_URL]);

  // Handle OAuth callback
  const handleCallback = async (authCode) => {
    logDebug('Received Authorization Code', authCode ? `${authCode.substring(0, 10)}...` : 'MISSING');

    if (!authCode) {
      setError('Authorization code is missing.');
      return;
    }

    setIsLoading(true);
    
    try {
      logDebug('Sending token request to backend', {
        url: `${API_URL}/fitbit/token`,
        method: 'POST',
        codeLength: authCode.length
      });
      
      // Exchange code for token through your backend
      const response = await axios.post(`${API_URL}/fitbit/token`, {
        code: authCode
      });

      logDebug('Token response received', {
        status: response.status,
        success: response.data.success,
        hasAccessToken: !!response.data.access_token,
        hasRefreshToken: !!response.data.refresh_token,
        expiresIn: response.data.expires_in
      });

      if (response.data.success && response.data.access_token) {
        localStorage.setItem('fitbit_access_token', response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem('fitbit_refresh_token', response.data.refresh_token);
        }
        localStorage.setItem('fitbit_token_expiry', Date.now() + ((response.data.expires_in || 3600) * 1000));
        
        setIsConnected(true);
        fetchFitbitData(response.data.access_token);
      } else {
        throw new Error('Failed to get valid access token');
      }
    } catch (error) {
      logDebug('Token exchange error', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        errorDetails: error.response?.data?.errorDetails
      });
      
      setError(`Failed to connect to Fitbit: ${error.response?.data?.errors?.[0] || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Fitbit data
  const fetchFitbitData = async (accessToken) => {
    setIsLoading(true);
    
    try {
      const endpoint = 'activities/heart/date/today/1d.json';
      
      logDebug('Fetching Fitbit data', {
        endpoint: endpoint,
        hasToken: !!accessToken
      });
      
      // Use your backend to proxy the request to Fitbit
      const response = await axios.get(
        `${API_URL}/fitbit/data`,
        {
          params: {
            access_token: accessToken,
            endpoint: endpoint
          }
        }
      );
  
      logDebug('Data response received', {
        status: response.status,
        success: response.data.success,
        dataKeys: response.data.data ? Object.keys(response.data.data) : 'NO_DATA'
      });
  
      if (response.data.success && response.data.data) {
        setUserData(response.data.data);
        
        // Extract current heart rate if available for monitoring
        if (response.data.data['activities-heart'] && 
            response.data.data['activities-heart'][0].value && 
            response.data.data['activities-heart'][0].value.restingHeartRate) {
          setLastHeartRate(response.data.data['activities-heart'][0].value.restingHeartRate);
        }
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (err) {
      logDebug('Data fetch error', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      setError('Unable to fetch data from Fitbit.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate real-time heart rate monitoring
  const simulateRealtimeHeartRate = () => {
    // Simulate a random heart rate between 60 and 160 BPM
    const simulatedHeartRate = Math.floor(Math.random() * 100) + 60;
    setLastHeartRate(simulatedHeartRate);
    return simulatedHeartRate;
  };

  // Monitor heart rate for signs of distress
  const monitorHeartRate = async () => {
    const currentHeartRate = simulateRealtimeHeartRate(); // Simulated heart rate
    
    if (currentHeartRate) {
      logDebug('Current heart rate', currentHeartRate);
      
      // Check if heart rate exceeds threshold
      if (currentHeartRate > heartRateThreshold) {
        logDebug('Elevated heart rate detected', {
          current: currentHeartRate,
          threshold: heartRateThreshold
        });
        
        // If not already in distress state, trigger alert
        if (!distressDetected && !alertSent.current) {
          setDistressDetected(true);
          sendDistressAlert(currentHeartRate);
        }
      } else {
        // Reset distress status if heart rate returns to normal
        if (distressDetected) {
          setDistressDetected(false);
          // After 5 minutes, allow alerts to be sent again
          setTimeout(() => {
            alertSent.current = false;
          }, 5 * 60 * 1000);
        }
      }
    }
  };
  
  // Start continuous heart rate monitoring
  const startMonitoring = () => {
    if (monitoringEnabled) return;
    
    if (emergencyContacts.length === 0) {
      setError('Please add at least one emergency contact before enabling monitoring.');
      return;
    }
    
    setMonitoringEnabled(true);
    setMonitoringStatus('active');
    alertSent.current = false;
    
    // Check heart rate every 30 seconds
    monitoringInterval.current = setInterval(monitorHeartRate, 30000);
    
    // Immediately fetch current heart rate
    monitorHeartRate();
    
    logDebug('Monitoring started', {
      threshold: heartRateThreshold,
      contactCount: emergencyContacts.length
    });
  };
  
  // Stop continuous heart rate monitoring
  const stopMonitoring = () => {
    if (!monitoringEnabled) return;
    
    setMonitoringEnabled(false);
    setMonitoringStatus('inactive');
    setDistressDetected(false);
    
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
    
    logDebug('Monitoring stopped', {
      lastHeartRate: lastHeartRate
    });
  };
  
  // Send alerts to emergency contacts using Telegram Bot
  const sendDistressAlert = async (currentHeartRate) => {
    if (alertSent.current) return;

    logDebug('Sending distress alert', {
      contacts: emergencyContacts.length,
      heartRate: currentHeartRate
    });

    // Mark that we've sent an alert to prevent duplicate alerts
    alertSent.current = true;

    try {
      // Get user's location
      const position = await getCurrentLocation();

      // Simulate sending an alert to the backend
      logDebug('Simulating backend alert request', {
        heart_rate: currentHeartRate,
        threshold: heartRateThreshold,
        location: position,
        emergency_contacts: emergencyContacts,
        timestamp: new Date().toISOString()
      });

      // Simulate a successful response from the backend
      const simulatedResponse = {
        success: true,
        alertId: `simulated-alert-${Date.now()}`,
        contactsNotified: emergencyContacts.length
      };

      logDebug('Simulated alert response', simulatedResponse);

      // Send Telegram notifications to emergency contacts
      for (const contact of emergencyContacts) {
        if (contact.telegramChatId) {
          const message = `🚨 EMERGENCY ALERT 🚨\n\nYour contact has detected a distress signal.\n\nDetails:\n- Heart Rate: ${currentHeartRate} BPM\n- Threshold: ${heartRateThreshold} BPM\n- Location: https://www.google.com/maps?q=${position.latitude},${position.longitude}`;

          // Send message using Telegram Bot API
          await axios.post(TELEGRAM_API_URL, {
            chat_id: contact.telegramChatId,
            text: message
          });

          logDebug('Telegram message sent', {
            contact: contact.name,
            chatId: contact.telegramChatId,
            message: message
          });
        }
      }

      setMonitoringStatus('alert_sent');
    } catch (err) {
      logDebug('Alert sending error', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });

      setError('Failed to send emergency alert. Please check your connection.');
      setMonitoringStatus('alert_failed');
    }
  };
  
  // Get current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(new Error(`Unable to get location: ${error.message}`));
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };
  
  // Add emergency contact
  const addEmergencyContact = (contact) => {
    const updatedContacts = [...emergencyContacts, contact];
    setEmergencyContacts(updatedContacts);
    localStorage.setItem('emergency_contacts', JSON.stringify(updatedContacts));
    
    logDebug('Emergency contact added', {
      name: contact.name,
      totalContacts: updatedContacts.length
    });
  };
  
  // Remove emergency contact
  const removeEmergencyContact = (contactId) => {
    const updatedContacts = emergencyContacts.filter(contact => contact.id !== contactId);
    setEmergencyContacts(updatedContacts);
    localStorage.setItem('emergency_contacts', JSON.stringify(updatedContacts));
    
    logDebug('Emergency contact removed', {
      contactId: contactId,
      remainingContacts: updatedContacts.length
    });
  };
  
  // Update heart rate threshold
  const updateHeartRateThreshold = (threshold) => {
    const value = parseInt(threshold, 10);
    if (isNaN(value) || value < 60 || value > 220) {
      setError('Please enter a valid heart rate threshold between 60 and 220 BPM.');
      return;
    }
    
    setHeartRateThreshold(value);
    localStorage.setItem('heart_rate_threshold', value.toString());
    
    logDebug('Heart rate threshold updated', {
      newThreshold: value
    });
  };

  // Disconnect from Fitbit
  const handleDisconnect = () => {
    // Stop monitoring if active
    if (monitoringEnabled) {
      stopMonitoring();
    }
    
    logDebug('Disconnecting Fitbit', 'Removing stored tokens');
    localStorage.removeItem('fitbit_access_token');
    localStorage.removeItem('fitbit_refresh_token');
    localStorage.removeItem('fitbit_token_expiry');
    setIsConnected(false);
    setUserData(null);
    setLastHeartRate(null);
  };

  // Function to render heart rate data in a more user-friendly way
  const renderHeartRateData = () => {
    if (!userData || !userData['activities-heart']) {
      return <p className="no-data">No heart rate data available</p>;
    }

    const heartData = userData['activities-heart'][0];
    const date = heartData.dateTime;
    const restingHeartRate = heartData.value?.restingHeartRate;
    const heartRateZones = heartData.value?.heartRateZones || [];

    return (
      <div className="heart-rate-container">
        <div className="heart-rate-summary">
          <div className="heart-rate-date">
            <h3>Data for {date}</h3>
            {restingHeartRate && (
              <div className="resting-heart-rate">
                <span className="heart-icon">♥️</span>
                <span className="heart-rate-value">{restingHeartRate}</span>
                <span className="heart-rate-label">Resting BPM</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="heart-rate-zones">
          <h3>Heart Rate Zones</h3>
          <div className="zones-grid">
            {heartRateZones.map((zone, index) => (
              <div className={`zone-card zone-${index}`} key={zone.name}>
                <h4>{zone.name}</h4>
                <div className="zone-details">
                  <div className="zone-range">
                    <span className="range-label">Range:</span>
                    <span className="range-value">{zone.min}-{zone.max} bpm</span>
                  </div>
                  <div className="zone-minutes">
                    <span className="minutes-label">Time:</span>
                    <span className="minutes-value">{(zone.minutes || 0)} min</span>
                  </div>
                  <div className="zone-calories">
                    <span className="calories-label">Calories:</span>
                    <span className="calories-value">{zone.caloriesOut || 0} cal</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="data-actions">
          <button className="view-raw-data" onClick={() => setShowRawData(!showRawData)}>
            {showRawData ? 'Hide Raw Data' : 'View Raw Data'}
          </button>
          {showRawData && (
            <div className="raw-data">
              <h3>Raw Data</h3>
              <pre>{JSON.stringify(userData, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render emergency monitoring section
  const renderEmergencyMonitoring = () => {
    return (
      <div className="emergency-monitoring-section">
        <h2>
          Emergency Monitoring
          <span className={`monitoring-status-indicator ${monitoringStatus}`}>
            {monitoringStatus === 'active' && 'Active'}
            {monitoringStatus === 'inactive' && 'Inactive'}
            {monitoringStatus === 'alert_sent' && 'Alert Sent'}
            {monitoringStatus === 'alert_failed' && 'Alert Failed'}
          </span>
        </h2>
        
        <div className="monitoring-controls">
          {monitoringEnabled ? (
            <button 
              className="stop-monitoring-button" 
              onClick={stopMonitoring}
            >
              Stop Monitoring
            </button>
          ) : (
            <button 
              className="start-monitoring-button" 
              onClick={startMonitoring}
              disabled={!isConnected || emergencyContacts.length === 0}
            >
              Start Emergency Monitoring
            </button>
          )}
        </div>
        
        {distressDetected && (
          <div className="distress-alert">
            <div className="alert-icon">⚠️</div>
            <div className="alert-message">
              <h3>Distress Detected</h3>
              <p>Your heart rate is above the threshold ({heartRateThreshold} BPM).</p>
              <p>Current heart rate: {lastHeartRate} BPM</p>
              <p>Emergency contacts have been notified.</p>
            </div>
            <button 
              className="dismiss-alert-button"
              onClick={() => {
                setDistressDetected(false);
                // Allow alerts to be sent again after 5 minutes
                setTimeout(() => {
                  alertSent.current = false;
                }, 5 * 60 * 1000);
              }}
            >
              I'm Safe
            </button>
          </div>
        )}
        
        <div className="threshold-settings">
          <h3>Heart Rate Threshold</h3>
          <p>Alert will be triggered if your heart rate exceeds:</p>
          <div className="threshold-input-group">
            <input 
              type="number" 
              value={heartRateThreshold} 
              min="60" 
              max="220" 
              onChange={(e) => updateHeartRateThreshold(e.target.value)} 
              disabled={monitoringEnabled}
            />
            <span className="unit">BPM</span>
          </div>
          <p className="threshold-note">
            Recommended: Set 30-40 BPM above your average resting heart rate
          </p>
        </div>
        
        <div className="emergency-contacts">
          <h3>Emergency Contacts</h3>
          
          {emergencyContacts.length === 0 ? (
            <p className="no-contacts">No emergency contacts added yet</p>
          ) : (
            <ul className="contacts-list">
              {emergencyContacts.map(contact => (
                <li key={contact.id} className="contact-item">
                  <div className="contact-info">
                    <span className="contact-name">{contact.name}</span>
                    <span className="contact-phone">{contact.phone}</span>
                    <span className="contact-relation">{contact.relation}</span>
                    {contact.telegramChatId && (
                      <span className="contact-telegram">Telegram: {contact.telegramChatId}</span>
                    )}
                  </div>
                  <button 
                    className="remove-contact" 
                    onClick={() => removeEmergencyContact(contact.id)}
                    disabled={monitoringEnabled}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          {/* Contact form - simplified for brevity */}
          {!monitoringEnabled && (
            <ContactForm onAddContact={addEmergencyContact} />
          )}
        </div>
      </div>
    );
  };
  
  // Contact form component
  const ContactForm = ({ onAddContact }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [relation, setRelation] = useState('');
    const [telegramChatId, setTelegramChatId] = useState('');
    
    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!name || !phone) {
        setError('Name and phone number are required.');
        return;
      }
      
      onAddContact({
        id: Date.now().toString(),
        name,
        phone,
        relation,
        telegramChatId
      });
      
      // Reset form
      setName('');
      setPhone('');
      setRelation('');
      setTelegramChatId('');
    };
    
    return (
      <form className="contact-form" onSubmit={handleSubmit}>
        <h4>Add Emergency Contact</h4>
        <div className="form-row">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <input
            type="text"
            placeholder="Relationship (optional)"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
          />
        </div>
        <div className="form-row">
          <input
            type="text"
            placeholder="Telegram Chat ID (optional)"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
          />
        </div>
        <button type="submit" className="add-contact-button">
          Add Contact
        </button>
      </form>
    );
  };

  // State for showing raw data
  const [showRawData, setShowRawData] = useState(false);

  return (
    <div className="wearable-integration-page">
      <header className="page-header">
        <h1>Integrate Your Fitbit for Crime Prevention Insights</h1>
        <p className="tagline">Share your wearable data to contribute to community safety efforts</p>
      </header>

      <div className="content-container">
        {!isConnected ? (
          <div className="connection-section">
            <div className="connection-info">
              <h2>Connect Your Fitbit</h2>
              <p>By connecting your Fitbit device, you can:</p>
              <ul className="benefits-list">
                <li>Share anonymized heart rate data for safety pattern analysis</li>
                <li>Contribute to community-wide safety improvements</li>
                <li>Help identify potential crime hotspots based on physiological responses</li>
                <li>Receive personalized safety recommendations</li>
                <li><strong>Enable emergency monitoring that can detect distress and alert contacts</strong></li>
              </ul>
              <p className="privacy-note">Your privacy is important. All data is anonymized and securely stored.</p>
            </div>
            
            <div className="connection-action">
              <OAuthPopup
                url={FITBIT_AUTH_URL}
                onCode={handleCallback}
                onClose={() => {
                  logDebug('OAuth popup closed', 'User canceled or closed the popup');
                }}
              >
                <button className="cta-button" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span className="fitbit-icon">⌚</span>
                      <span>Connect Fitbit</span>
                    </>
                  )}
                </button>
              </OAuthPopup>
            </div>
          </div>
        ) : (
          <div className="data-section">
            <div className="connection-status">
              <div className="status-indicator connected">
                <span className="status-icon">✓</span>
                <span className="status-text">Fitbit Connected</span>
              </div>
              <button className="disconnect-button" onClick={handleDisconnect}>
                Disconnect
              </button>
            </div>
            
            {/* Emergency Monitoring Section */}
            {renderEmergencyMonitoring()}
            
            <h2>Your Heart Rate Data</h2>
            
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading your Fitbit data...</p>
              </div>
            ) : userData ? (
              renderHeartRateData()
            ) : (
              <div className="no-data-container">
                <p>No data available</p>
                <button className="retry-button" onClick={() => {
                  const token = localStorage.getItem('fitbit_access_token');
                  if (token) fetchFitbitData(token);
                }}>
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error-section">
            <div className="error-icon">⚠️</div>
            <p className="error-message">{error}</p>
            <button 
              className="dismiss-error" 
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
      
      <div className="debug-section">
        <button 
          onClick={() => setShowDebug(!showDebug)} 
          className={`debug-toggle ${showDebug ? 'active' : ''}`}
        >
          {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>
        
        {showDebug && (
          <div className="debug-panel">
            <h3>Debug Information</h3>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default FitbitIntegration; */
