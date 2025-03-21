import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Spin, message } from 'antd';

const VideoUpload = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const socketRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://127.0.0.1:5000');  // Connect to backend on port 5000
  
    socketRef.current.on('connect', () => {
      console.log('Connected to backend');
    });
  
    socketRef.current.on('prediction', (data) => {
      setPrediction(data.prediction);
      setLoading(false);
    });
  
    socketRef.current.on('error', (error) => {
      message.error(error.message);
      setLoading(false);
    });
  
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  

  useEffect(() => {
    // Start video stream on page load
    const startWebcam = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });

      videoRef.current.srcObject = stream;
      setVideoStream(stream);
    };

    startWebcam();

    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const captureAndSendFrame = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Convert the canvas image to a base64 string
      const imageData = canvasRef.current.toDataURL('image/jpeg'); 
      
      // Log base64 image data to check if it's properly encoded
      console.log("Sending image data to backend:", imageData);  // Ensure this logs a valid base64 string
      
      socketRef.current.emit('frame', { image: imageData });
  
      // Optional: Show loading while waiting for prediction
      setLoading(true);
    }
  };
  
  useEffect(() => {
    const intervalId = setInterval(captureAndSendFrame, 100); // Capture and send frame every 100ms (10 fps)

    return () => {
      clearInterval(intervalId); // Cleanup interval on component unmount
    };
  }, []);

  return (
    <div>
      <h2>Real-Time Video Processing</h2>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <video ref={videoRef} autoPlay width="640" height="480" style={{ border: '1px solid black' }}></video>
        <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }}></canvas>
      </div>

      <div style={{ textAlign: 'center' }}>
        {loading ? <Spin size="large" /> : null}
        {prediction && !loading && <div>Prediction: {prediction}</div>}
      </div>
    </div>
  );
};

export default VideoUpload;
