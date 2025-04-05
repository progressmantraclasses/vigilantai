import React, { useState, useRef, useEffect } from "react";
import StreamingAvatar, { AvatarQuality, StreamingEvents, TaskType } from "@heygen/streaming-avatar";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import './Avtar.css'; // Import CSS file

const LegalAdvisorAvatar = () => {
  const videoRef = useRef(null);
  const userInputRef = useRef(null);
  const [avatar, setAvatar] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [legalAdvice, setLegalAdvice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Speech recognition setup
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Update input field with transcript
  useEffect(() => {
    if (userInputRef.current && transcript) {
      userInputRef.current.value = transcript;
    }
  }, [transcript]);

  // Update listening state
  useEffect(() => {
    setIsListening(listening);
  }, [listening]);

  // 🔹 Fetch HeyGen Token
  const fetchAccessToken = async () => {
    try {
      const apiKey = import.meta.env.VITE_HEYGEN_API_KEY; // Get API key from .env
      if (!apiKey) {
        throw new Error("HeyGen API key is missing! Check your .env file.");
      }

      const response = await fetch("https://api.heygen.com/v1/streaming.create_token", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({}), // Empty body as per API
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(`Failed to get token: ${result.message || "Unknown error"}`);
      }

      console.log("✅ Token received:", result.data.token);
      return result.data.token;
    } catch (error) {
      console.error("❌ Error fetching token:", error);
      return null;
    }
  };

  // 🔹 Initialize Streaming Avatar
  const initializeAvatarSession = async () => {
    try {
      const token = await fetchAccessToken();
      if (!token) return;

      const newAvatar = new StreamingAvatar({ token });
      setAvatar(newAvatar);

      const newSessionData = await newAvatar.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: "default",
      });

      setSessionData(newSessionData);
      setIsSessionActive(true);
      console.log("✅ Session started:", newSessionData);

      // 🔹 Set up event listeners
      newAvatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
      newAvatar.on(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);
    } catch (error) {
      console.error("❌ Error initializing avatar session:", error);
    }
  };

  // 🔹 Handle Stream Ready
  const handleStreamReady = (event) => {
    if (event.detail && videoRef.current) {
      videoRef.current.srcObject = event.detail;
      videoRef.current.onloadedmetadata = () => videoRef.current.play().catch(console.error);
    } else {
      console.error("❌ Stream is not available");
    }
  };

  // 🔹 Handle Stream Disconnection
  const handleStreamDisconnected = () => {
    console.log("⚠️ Stream disconnected");
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsSessionActive(false);
  };

  // 🔹 End Avatar Session
  const terminateAvatarSession = async () => {
    if (!avatar || !sessionData) return;

    try {
      await avatar.stopAvatar();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setAvatar(null);
      setSessionData(null);
      setIsSessionActive(false);
    } catch (error) {
      console.error("❌ Error terminating avatar session:", error);
    }
  };

  // 🔹 Fetch legal Advice from Flask Backend
  const fetchLegalAdvice = async () => {
    setIsLoading(true);
    try {
      // Update to use the correct endpoint and add error handling
      const userQuery = userInputRef.current?.value || "Give me legal advice";
      console.log("Sending query to backend:", userQuery);
      
      const response = await fetch("http://localhost:5000/legal-advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: userQuery
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(`Failed to fetch legal advice: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Received response:", data);
      
      if (data.detailed_advice) {
        setLegalAdvice(data.detailed_advice);
        
        // Make the avatar repeat the legal advice using REPEAT task type
        if (avatar) {
          await avatar.speak({ 
            text: data.detailed_advice, 
            taskType: TaskType.REPEAT 
          });
        }
      } else {
        throw new Error("No advice received from server");
      }
    } catch (error) {
      console.error("❌ Error fetching legal advice:", error);
      
      // Provide more detailed error info
      const errorMessage = `Error: ${error.message}. Please check if the server is running at http://localhost:5000`;
      console.error(errorMessage);
      
      // Use sample legal advice if the backend call fails
      const sampleAdvice = getSampleLegalAdvice();
      setLegalAdvice(sampleAdvice);
      
      if (avatar) {
        await avatar.speak({ 
          text: sampleAdvice, 
          taskType: TaskType.REPEAT 
        });
      }
    } finally {
      setIsLoading(false);
      userInputRef.current.value = ""; // Clear input
      resetTranscript(); // Reset speech recognition transcript
    }
  };

  // 🔹 Sample legal advice function
  const getSampleLegalAdvice = () => {
    const adviceOptions = [
      "If you're facing a contract dispute, it's important to review the terms carefully. Check for any breach of contract clauses and gather relevant communication or evidence. Consulting a lawyer who specializes in contract law can help you understand your rights and options for resolution.",
      
      "If you're dealing with workplace discrimination, know that employment laws protect you against unfair treatment based on race, gender, disability, or other protected categories. Document any incidents, report them through the appropriate channels, and consider seeking legal counsel if the issue persists.",
      
      "Considering starting a business? Make sure to choose the right legal structure—LLC, sole proprietorship, or corporation—based on your needs. Each structure has different liability protections and tax implications, so consulting a business attorney can help you set up properly.",
      
      "If you've been accused of a crime, it's crucial to exercise your right to remain silent and seek legal representation immediately. A criminal defense attorney can guide you through the legal process and ensure your rights are protected.",
      
      "When dealing with family law matters like divorce or child custody, mediation can sometimes be a more amicable and cost-effective solution than court battles. Understanding your legal rights and obligations early on can help you make informed decisions."
    ];
    
    return adviceOptions[Math.floor(Math.random() * adviceOptions.length)];
  };

  // 🔹 Toggle Speech Recognition
  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  // 🔹 Handle Voice Input Completion
  const handleVoiceInputComplete = () => {
    SpeechRecognition.stopListening();
    if (transcript) {
      fetchLegalAdvice(); // Use the voice input to get legal advice
    }
  };

  // 🔹 Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (avatar && sessionData) {
        avatar.stopAvatar().catch(console.error);
      }
      SpeechRecognition.abortListening();
    };
  }, [avatar, sessionData]);

  // 🔹 Handle Enter Key Press
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      fetchLegalAdvice(); // Get legal advice instead of direct speaking
    }
  };

  // Display warning if browser doesn't support speech recognition
  if (!browserSupportsSpeechRecognition) {
    return <div className="browser-warning">Your browser does not support speech recognition. Please try Chrome.</div>;
  }

  return (
    <main className="avatar-container">
      <h1 className="app-title">👨‍💼 AI Legal Advisor</h1>

      <div className="video-container">
        <video ref={videoRef} autoPlay playsInline className="avatar-video" />
        {!isSessionActive && (
          <div className="video-placeholder">
            <span>Start session to activate your legal advisor</span>
          </div>
        )}
      </div>

      <div className="controls-container">
        <div className="button-group">
          <button 
            className={`control-button ${isSessionActive ? 'disabled' : 'primary'}`}
            onClick={initializeAvatarSession} 
            disabled={isSessionActive}
          >
            Start Advisor Session
          </button>
          <button 
            className={`control-button ${!isSessionActive ? 'disabled' : 'secondary'}`}
            onClick={terminateAvatarSession} 
            disabled={!isSessionActive}
          >
            End Session
          </button>
        </div>
        
        <div className="input-group">
          <input 
            type="text" 
            ref={userInputRef} 
            placeholder="Enter your legal question..." 
            aria-label="Text for avatar to speak" 
            onKeyPress={handleKeyPress}
            className="text-input"
            disabled={isLoading}
          />
          <button 
            className="speak-button"
            onClick={fetchLegalAdvice}
            disabled={!isSessionActive || isLoading}
          >
            {isLoading ? "Loading..." : "Ask Question"}
          </button>
        </div>
        
        <div className="voice-controls">
          <button 
            className={`voice-button ${isListening ? 'listening' : ''}`}
            onClick={toggleListening}
            disabled={!isSessionActive || isLoading}
          >
            {isListening ? "Stop Listening" : "Start Voice Input"}
          </button>
          
          {isListening && (
            <button 
              className="send-voice-button"
              onClick={handleVoiceInputComplete}
              disabled={isLoading}
            >
              Use Voice Input
            </button>
          )}
        </div>
        
        {isListening && (
          <div className="listening-indicator">
            🎤 Listening... Speak now
          </div>
        )}
        
        {isLoading && (
          <div className="loading-indicator">
            🔄 Processing...
          </div>
        )}
        
        {legalAdvice && (
          <div className="advice-display">
            <h3>Text Being Spoken:</h3>
            <p>{legalAdvice}</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default LegalAdvisorAvatar;
