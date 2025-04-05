import React, { useState } from 'react';
import axios from 'axios';
import { Layout, Menu, Button } from 'antd';
import { HomeOutlined, DashboardOutlined, FireOutlined, FileTextOutlined, SafetyOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const { Header, Content, Footer } = Layout;

const VideoUpload = () => {
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [inferenceTime, setInferenceTime] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle video file change
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    setVideo(file);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!video) {
        alert("Please select a video file!");
        return;
    }

    const formData = new FormData();
    formData.append('video', video);
    console.log("Video file being uploaded:", video);  // Debugging log

    setLoading(true);

    try {
        const response = await axios.post('http://127.0.0.1:5000/predict', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000,
        });

        setPrediction(response.data.predicted_class);
        setInferenceTime(response.data.inference_time);
    } catch (error) {
        console.error("Error uploading video:", error);
        alert(`Error: ${error.message}`);
    } finally {
        setLoading(false);
    }
};

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

      {/* Video Upload Form */}
      <Content className="px-10 py-16">
        <h1 className="text-3xl font-bold text-center text-white mb-8">Video Crime Prediction</h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col text-white items-center">
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="mb-4 p-2 text-white bg-[#112240] border-none rounded-lg shadow-lg"
          />
          <Button 
            type="primary" 
            size="large" 
            className="text-2xl bg-blue-600 border-none"
            htmlType="submit"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Upload and Predict'}
          </Button>
        </form>

        {prediction !== null && (
          <div className="mt-8 text-center text-white">
            <h2 className="text-xl font-semibold">Prediction: {prediction}</h2>
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

export default VideoUpload;
