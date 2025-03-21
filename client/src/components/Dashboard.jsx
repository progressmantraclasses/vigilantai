import React, { useEffect, useState } from "react";
import axios from "axios";
import { Layout, Menu, Card, Button } from "antd";
import { HomeOutlined, FileTextOutlined, PhoneOutlined, DashboardOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Header, Content, Footer } = Layout;

const Dashboard = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [reports, setReports] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [activeSection, setActiveSection] = useState("contacts");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contactRes = await axios.get("http://localhost:5000/api/contact");
        const reportRes = await axios.get("http://localhost:5000/api/reports");
        const emergencyRes = await axios.get("http://localhost:5000/api/emergency");

        setContacts(contactRes.data);
        setReports(reportRes.data);
        setEmergencies(emergencyRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <Layout className="min-h-screen bg-[#0A192F] text-white">
      {/* Navbar */}
      <Header className="bg-[#112240] flex justify-between items-center px-6 shadow-lg border-b border-gray-600">
        <div className="text-xl font-bold text-white">Vigilant AI Dashboard</div>
        <Menu theme="dark" mode="horizontal" className="bg-[#112240] text-white border-none" selectedKeys={[]}>
          <Menu.Item key="1" icon={<HomeOutlined />} onClick={() => navigate("/")}>Home</Menu.Item>
          <Menu.Item key="2" icon={<DashboardOutlined />} onClick={() => navigate("/dashboard")}>Dashboard</Menu.Item>
          <Menu.Item key="3" icon={<PhoneOutlined />} onClick={() => navigate("/contact")}>Contact</Menu.Item>
        </Menu>
      </Header>

      {/* Dashboard Heading */}
      <Content className="p-10">
        <h2 className="text-3xl text-white font-bold text-center mb-6">📊 Dashboard - Manage Reports & Contacts</h2>

        {/* Buttons to Toggle Data */}
        <div className="flex justify-center gap-6 mb-8">
          <Button onClick={() => setActiveSection("contacts")} className={`px-4 py-2 rounded ${activeSection === "contacts" ? "bg-blue-600" : "bg-gray-700"} text-white`}>📩 Show Contacts</Button>
          <Button onClick={() => setActiveSection("reports")} className={`px-4 py-2 rounded ${activeSection === "reports" ? "bg-blue-600" : "bg-gray-700"} text-white`}>📑 Show Reports</Button>
          <Button onClick={() => setActiveSection("emergencies")} className={`px-4 py-2 rounded ${activeSection === "emergencies" ? "bg-blue-600" : "bg-gray-700"} text-white`}>🚨 Show FIRs</Button>
        </div>

        {/* Section Rendering Based on Active Tab */}
        {activeSection === "contacts" && (
          <>
            <h3 className="text-2xl font-bold text-blue-400 mb-4">📩 Contact Messages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.length > 0 ? (
                contacts.map((contact, index) => (
                  <Card key={index} className="bg-[#112240] text-white border-none shadow-lg p-4">
                    <h3 className="text-lg font-bold">{contact.name}</h3>
                    <p><strong>📌 Subject:</strong> {contact.subject}</p>
                    <p><strong>📨 Message:</strong> {contact.message}</p>
                    <p><strong>📩 Email:</strong> {contact.email}</p>
                    <p><strong>📞 Contact:</strong> {contact.contact || "N/A"}</p>
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-400">No Contact Messages Found.</p>
              )}
            </div>
          </>
        )}

        {activeSection === "reports" && (
          <>
            <h3 className="text-2xl font-bold text-green-400 mb-4">📑 Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.length > 0 ? (
                reports.map((report, index) => (
                  <Card key={index} className="bg-[#112240] text-white border-none shadow-lg p-4">
                    <h3 className="text-lg font-bold">{report.name}</h3>
                    <p><strong>📍 Location:</strong> {report.location}</p>
                    <p><strong>📆 Date & Time:</strong> {report.datetime}</p>
                    <p><strong>📌 Subject:</strong> {report.subject}</p>
                    <p><strong>📝 Description:</strong> {report.description}</p>
                    <p><strong>📩 Email:</strong> {report.email}</p>
                    <p><strong>📞 Contact:</strong> {report.contact || "N/A"}</p>
                    {report.fileUrl && <img src={`http://localhost:5000${report.fileUrl}`} alt="Report File" className="mt-2 w-full h-40 object-cover rounded-lg" />}
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-400">No Reports Found.</p>
              )}
            </div>
          </>
        )}

        {activeSection === "emergencies" && (
          <>
            <h3 className="text-2xl font-bold text-red-400 mb-4">🚨 FIR Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {emergencies.length > 0 ? (
                emergencies.map((emergency, index) => (
                  <Card key={index} className="bg-[#112240] text-white border-none shadow-lg p-4">
                    <p><strong>📍 Location:</strong> {emergency.location}</p>
                    {emergency.fileUrl && <img src={`http://localhost:5000${emergency.fileUrl}`} alt="Emergency File" className="mt-2 w-full h-40 object-cover rounded-lg" />}
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-400">No FIRs Found.</p>
              )}
            </div>
          </>
        )}
      </Content>

      {/* Footer */}
      <Footer className="bg-[#112240] text-center text-gray-400 py-6">
        <p>© 2025 Vigilant AI. All rights reserved.</p>
      </Footer>
    </Layout>
  );
};

export default Dashboard;
