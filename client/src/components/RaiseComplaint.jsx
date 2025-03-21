import React, { useState, useRef, useEffect } from "react";
import { Layout, Menu, Button, Input, Switch, Upload, message, DatePicker } from "antd";
import { HomeOutlined, FileTextOutlined, SafetyOutlined, FireOutlined, InboxOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const { Header, Content } = Layout;
const { Dragger } = Upload;

const LandingPage = () => {
  const navigate = useNavigate();
  const [anonymous, setAnonymous] = useState(false);
  const [complaint, setComplaint] = useState({ name: "", location: "", datetime: null, subject: "", description: "", contact: "", email: "", file: null });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [geoLocation, setGeoLocation] = useState(null);  // store geolocation as null initially

  // Access webcam and fetch geolocation
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Error accessing webcam: ", err));

    // Check if geolocation is available and fetch location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setGeoLocation(`${lat}, ${lon}`);  // Set geolocation if access granted
        },
        (error) => {
          console.error("Error fetching location:", error);
          setGeoLocation(null);  // Clear geolocation if access is denied or error occurs
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.error("Geolocation not supported.");
      setGeoLocation(null);  // Ensure geoLocation is empty if geolocation is not supported
    }
  }, []);

  // Capture image from webcam
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL("image/png");

      const byteString = atob(imageDataUrl.split(',')[1]);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uintArray = new Uint8Array(arrayBuffer);

      for (let i = 0; i < byteString.length; i++) {
        uintArray[i] = byteString.charCodeAt(i);
      }

      const file = new Blob([uintArray], { type: "image/png" });
      const fileObject = new File([file], "captured-image.png", { type: "image/png" });

      setCapturedImage(fileObject);
      return fileObject;
    }
    return null;
  };

  // Handle urgent report submission
  const handleReportUrgently = async () => {
    // Check if geolocation is available before submitting
    if (!geoLocation) {
      message.error("Geolocation access is required to submit the report.");
      return;
    }

    const image = captureImage();

    if (!image) {
      message.error("Image capture failed. Please try again.");
      return;
    }

    const formData = new FormData();
    formData.append("file", image);
    formData.append("location", geoLocation);  // Add geolocation if available

    try {
      const response = await fetch("http://localhost:5000/api/emergency", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        message.success("Form submitted successfully.");
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error("Error submitting report");
    }
  };

  // Handle FIR submission
  const handleFIRSubmit = async () => {
    if (!complaint.subject || !complaint.description) {
      message.error("Subject and description are required.");
      return;
    }

    // Check if geolocation is available before submitting
    if (!geoLocation) {
      message.error("Geolocation is required to submit the FIR.");
      return;
    }

    const formData = new FormData();
    Object.keys(complaint).forEach((key) => {
      if (complaint[key]) {
        formData.append(key, complaint[key]);
      }
    });

    try {
      const response = await fetch("http://localhost:5000/api/reports", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        message.success("FIR submitted successfully.");
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error("Error submitting FIR");
    }
  };

  return (
    <Layout className="min-h-screen bg-[#0A192F] text-white">
      <Header className="bg-[#112240] flex justify-between items-center px-6 shadow-lg border-b border-gray-600">
        <div className="text-xl font-bold text-white">Vigilant AI</div>
        <Menu theme="dark" mode="horizontal" className="bg-[#112240] text-white border-none">
          {[{ key: "1", icon: <HomeOutlined />, label: "Home", onClick: () => navigate("/") },
            { key: "2", icon: <FileTextOutlined />, label: "Raise Complaint", onClick: () => navigate("/complaint") },
            { key: "3", icon: <SafetyOutlined />, label: "Legal Assistance", onClick: () => navigate("/legal-assistance") },
            { key: "4", icon: <FireOutlined />, label: "SOS" }].map((item) => (
            <Menu.Item key={item.key} icon={item.icon} onClick={item.onClick} className="relative group cursor-pointer">
              {item.label}
              <motion.div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300" />
            </Menu.Item>
          ))}
        </Menu>
      </Header>

      <Content className="px-10 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <div className="flex flex-col items-center w-full">
          <h2 className="text-xl font-semibold mb-2 text-white">📷 Report Immediately</h2>
          <video ref={videoRef} autoPlay playsInline className="w-full h-[500px] rounded-lg border border-gray-600" />
          <canvas ref={canvasRef} style={{ display: "none" }} width="640" height="480"></canvas>
          <Button className="mt-4 bg-red-600 text-white px-6 py-3 rounded-md shadow-md" onClick={handleReportUrgently}>
            Report Urgently
          </Button>
        </div>

        <div className="bg-[#112240] p-6 rounded-lg shadow-md w-full max-h-[500px] overflow-y-auto no-scrollbar">
          <h2 className="text-3xl font-bold text-white mb-6">📝 File an FIR</h2>
          <p className="text-gray-400">Submit an FIR anonymously or with full details.</p>
          <div className="mt-4">
            <Switch checked={anonymous} onChange={() => setAnonymous(!anonymous)} className="mr-2" />
            <span className="text-gray-300">Submit Anonymously</span>
          </div>
          {!anonymous && (
            <>
              <label className="block text-white mt-4">Your Name</label>
              <input
                className="mt-2 p-3 w-full bg-gray-700 text-white border border-gray-500 placeholder-white focus:border-blue-500 focus:outline-none hover:border-blue-500"
                placeholder="Your Name"
                onChange={(e) => setComplaint({ ...complaint, name: e.target.value })}
              />

              <label className="block text-white mt-4">Your Location</label>
              <input
                className="mt-2 p-3 w-full bg-gray-700 text-white border border-gray-500 placeholder-white focus:border-blue-500 focus:outline-none hover:border-blue-500"
                placeholder="Your Location"
                onChange={(e) => setComplaint({ ...complaint, location: e.target.value })}
              />

              <label className="block text-white mt-4">Date & Time</label>
              <DatePicker
                showTime
                className="mt-2 w-full p-3 bg-gray-700 text-white border border-gray-500 placeholder-white focus:border-blue-500 focus:outline-none hover:border-blue-500"
                placeholder="Date & Time"
                onChange={(value) => setComplaint({ ...complaint, datetime: value })}
              />

              <label className="block text-white mt-4">Contact Number</label>
              <input
                className="mt-2 p-3 w-full bg-gray-700 text-white border border-gray-500 placeholder-white focus:border-blue-500 focus:outline-none hover:border-blue-500"
                placeholder="Contact Number"
                onChange={(e) => setComplaint({ ...complaint, contact: e.target.value })}
              />

              <label className="block text-white mt-4">Email Address</label>
              <input
                className="mt-2 p-3 w-full bg-gray-700 text-white border border-gray-500 placeholder-white focus:border-blue-500 focus:outline-none hover:border-blue-500"
                placeholder="Email Address"
                onChange={(e) => setComplaint({ ...complaint, email: e.target.value })}
              />
            </>
          )}

          <label className="block text-white mt-4">Subject</label>
          <input
            className="mt-2 p-3 w-full bg-gray-700 text-white border border-gray-500 placeholder-white focus:border-blue-500 focus:outline-none hover:border-blue-500"
            placeholder="Subject"
            onChange={(e) => setComplaint({ ...complaint, subject: e.target.value })}
          />

          <label className="block text-white mt-4">Describe the incident</label>
          <textarea
            className="mt-2 p-3 w-full bg-gray-700 text-white border border-gray-500 placeholder-white focus:border-blue-500 focus:outline-none hover:border-blue-500"
            rows={4}
            placeholder="Describe the incident..."
            onChange={(e) => setComplaint({ ...complaint, description: e.target.value })}
          />

          <label className="block text-white mt-4">Upload Evidence</label>
          <Dragger
            className="mt-2 bg-gray-700 text-white border border-gray-500 focus:border-blue-500 hover:border-blue-500"
            beforeUpload={(file) => {
              setComplaint({ ...complaint, file });
              return false;
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined className="text-4xl text-blue-400" />
            </p>
            <p className="text-white">Click or drag file to upload evidence</p>
          </Dragger>

          <Button type="primary" className="mt-4 w-full bg-blue-600 border-none" onClick={handleFIRSubmit}>
            Submit FIR
          </Button>
        </div>
      </Content>
    </Layout>
  );
};

export default LandingPage;
