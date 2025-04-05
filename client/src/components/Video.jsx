import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Layout, Menu, Button, Spin, message } from "antd";
import { HomeOutlined, DashboardOutlined, FireOutlined, FileTextOutlined, SafetyOutlined, UserOutlined, PhoneOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const { Header, Content, Footer } = Layout;

const Video = () => {
  const videoRef = useRef(null); // To reference the video element
  const [prediction, setPrediction] = useState(null);
  const [inferenceTime, setInferenceTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Initialize the video stream from the user's camera
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch((err) => {
          console.error("Error accessing the camera:", err);
        });
    }
  }, []);

  // Function to capture frames and send them to the backend for analysis
  const captureAndAnalyzeFrame = async () => {
    if (videoRef.current && !loading) {
      setLoading(true);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // Draw the current frame from the video to the canvas
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to base64 image data
      const imageData = canvas.toDataURL("image/jpeg");

      try {
        // Send the frame to the backend for prediction
        const startTime = Date.now(); // Capture time before the request
        const response = await axios.post("http://127.0.0.1:5000/predict", { image: imageData });

        const inferenceTime = (Date.now() - startTime) / 1000; // Time taken for the backend to respond

        setPrediction(response.data.predictions);
        setInferenceTime(inferenceTime);
      } catch (error) {
        console.error("Error sending frame to the backend:", error);
        message.error("Error processing the video");
      } finally {
        setLoading(false);
      }
    }
  };

  // Capture frames continuously every 100ms (10 frames per second)
  useEffect(() => {
    const interval = setInterval(captureAndAnalyzeFrame, 100);
    return () => clearInterval(interval); // Cleanup on component unmount
  }, [loading]);

  return (
    <Layout className="min-h-screen bg-[#0A192F] text-white">
      {/* Navbar */}
      <Header className="bg-[#112240] flex justify-between items-center px-6 shadow-lg border-b border-gray-600">
        <div className="text-xl font-bold text-white">Vigilant AI</div>
        <Menu theme="dark" mode="horizontal" className="bg-[#112240] text-white border-none">
          {[ 
            { key: "1", icon: <HomeOutlined />, label: "Home", onClick: () => navigate("/") },
            { key: "2", icon: <DashboardOutlined />, label: "Dashboard", onClick: () => navigate("/dashboard") },
            { key: "3", icon: <FireOutlined />, label: "Heatmap", onClick: () => navigate("/heatmap") },
            { key: "4", icon: <FileTextOutlined />, label: "Raise Complaint", onClick: () => navigate("/complaint") },
            { key: "5", icon: <SafetyOutlined />, label: "Legal Assistance", onClick: () => navigate("/legal-assistance") },
            { key: "6", icon: <UserOutlined />, label: "Wearable Integration", onClick: () => navigate("/wearable") },
            { key: "7", icon: <PhoneOutlined />, label: "Contact", onClick: () => navigate("/contact") },
          ].map((item) => (
            <Menu.Item key={item.key} icon={item.icon} onClick={item.onClick} className="relative group cursor-pointer">
              {item.label}
              <motion.div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300" />
            </Menu.Item>
          ))}
        </Menu>
      </Header>

      {/* Live CCTV Analysis */}
      <Content className="px-10 text-center py-16">
        <h1 className="text-3xl font-bold text-center text-white mb-8">Real-Time CCTV Crime Analysis</h1>

        <div style={{ position: "relative", display: "inline-block" }}>
          <video
            ref={videoRef}
            autoPlay
            width="640"
            height="360"
            style={{
              borderRadius: "10px",
              border: "2px solid #fff",
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
            }}
          ></video>
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              padding: "5px 15px",
              borderRadius: "5px",
            }}
          >
            {loading ? "Processing..." : prediction ? `Prediction: ${prediction.map(item => item.prediction).join(", ")}` : "Waiting for prediction..."}
          </div>
        </div>
        
        {inferenceTime && (
          <div style={{ marginTop: "10px", color: "white" }}>
            <strong>Inference Time: {inferenceTime.toFixed(2)} seconds</strong>
          </div>
        )}
      </Content>

      {/* Footer */}
      <Footer className="bg-[#112240] text-center text-gray-400 py-6">
        <p>Contact Us: support@vigilantai.com | +123 456 7890</p>
        <p>© 2025 Vigilant AI. All rights reserved.</p>
      </Footer>
    </Layout>
  );
};

export default Video;
