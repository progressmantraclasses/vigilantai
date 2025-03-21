import React, { useState } from "react";
import axios from "axios";
import { Layout, Menu, Button } from 'antd';
import { HomeOutlined, InfoCircleOutlined, PhoneOutlined, SafetyOutlined, FileTextOutlined, DashboardOutlined, FireOutlined, UserOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const { Header, Content, Footer } = Layout;

const ContactUs = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    message: "",
    email: "",
    contact: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/contact", formData);
      alert("Message sent successfully!");
      setFormData({ name: "", subject: "", message: "", email: "", contact: "" });
    } catch (error) {
      alert("Error sending message. Try again.");
    }
  };

  return (
    <Layout className="min-h-screen bg-[#0A192F] text-white">
      {/* Navbar */}
      <Header className="bg-[#112240] flex justify-between items-center px-6 shadow-lg border-b border-gray-600">
        <div className="text-xl font-bold text-white">Vigilant AI</div>
        <Menu theme="dark" mode="horizontal" className="bg-[#112240] text-white border-none" selectedKeys={[]}>      
          {[{ key: "1", icon: <HomeOutlined />, label: "Home", onClick: () => navigate("/") },
            { key: "2", icon: <InfoCircleOutlined />, label: "Features", onClick: () => navigate("/features") },
            { key: "3", icon: <DashboardOutlined />, label: "Dashboard", onClick: () => navigate("/dashboard") },
            { key: "4", icon: <FileTextOutlined />, label: "Raise Complaint", onClick: () => navigate("/complaint") },
            { key: "5", icon: <SafetyOutlined />, label: "Legal Assistance", onClick: () => navigate("/legal-assistance") },
            { key: "6", icon: <FireOutlined />, label: "Heatmap", onClick: () => navigate("/heatmap") },
            { key: "7", icon: <UserOutlined />, label: "Wearable Integration", onClick: () => navigate("/wearable") },
            { key: "8", icon: <PhoneOutlined />, label: "Contact", onClick: () => navigate("/contact") }].map(item => (
            <Menu.Item key={item.key} icon={item.icon} onClick={item.onClick} className="relative group cursor-pointer">
              {item.label}
              <motion.div 
                className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"
              />
            </Menu.Item>
          ))}
        </Menu>
      </Header>


      <Content className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-[#0A192F] p-6">
        {/* Left Side Image */}
        <div className="w-full md:w-1/2 flex justify-center">
          <img src="https://cdn.pixabay.com/photo/2024/07/14/07/46/customer-service-8893905_1280.png" alt="Contact Us" className="rounded-lg shadow-lg" />
        </div>
        
        {/* Right Side Form */}
        <div className="w-full md:w-1/2 p-6 bg-[#112240] rounded-lg shadow-lg">
          <h2 className="text-3xl text-center font-bold text-white mb-6">Contact Us</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="name" placeholder="Name" required className="w-full p-3 border rounded bg-[#0A192F] text-white" onChange={handleChange} value={formData.name} />
            <input type="text" name="subject" placeholder="Subject" required className="w-full p-3 border rounded bg-[#0A192F] text-white" onChange={handleChange} value={formData.subject} />
            <textarea name="message" placeholder="Message" required className="w-full p-3 border rounded bg-[#0A192F] text-white" rows="4" onChange={handleChange} value={formData.message}></textarea>
            <input type="email" name="email" placeholder="Email" required className="w-full p-3 border rounded bg-[#0A192F] text-white" onChange={handleChange} value={formData.email} />
            <input type="text" name="contact" placeholder="Contact (Optional)" className="w-full p-3 border rounded bg-[#0A192F] text-white" onChange={handleChange} value={formData.contact} />
            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700">Send Message</button>
          </form>
        </div>
      </Content>

      {/* Footer */}
      <Footer className="bg-[#112240] text-center text-gray-400 py-6">
        <div className="mb-4">
          <p>Contact Us: support@vigilantai.com | +123 456 7890</p>
          <p>Follow us on social media for updates and security tips.</p>
        </div>
        <p>© 2025 Vigilant AI. All rights reserved.</p>
      </Footer>
    </Layout>
  );
};

export default ContactUs;