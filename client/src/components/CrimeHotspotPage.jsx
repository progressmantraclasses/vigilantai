import React, { useEffect, useState } from "react";
import { Layout, Menu, Button } from "antd";
import { HomeOutlined, DashboardOutlined, FireOutlined, FileTextOutlined, SafetyOutlined, UserOutlined, PhoneOutlined, AimOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom Location Marker Icon
const locationIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const { Header, Content, Footer } = Layout;

const RecenterButton = ({ userLocation }) => {
  const map = useMap();
  return (
    <Button
      className="absolute top-4 right-4 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700"
      onClick={() => {
        map.flyTo(userLocation, 14, { animate: true });
      }}
    >
      <AimOutlined /> Recenter
    </Button>
  );
};

const CrimeHotspotPage = () => {
  const navigate = useNavigate();
  const [crimeData, setCrimeData] = useState([]);
  const [userLocation, setUserLocation] = useState([28.6139, 77.2090]); // Default: Connaught Place, Delhi

  useEffect(() => {
    // Fetch User's Real-Time Location
    navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true }
    );

    // Dummy Data for Crime Hotspots in Delhi
    setCrimeData([
      { location: "Connaught Place", time: "10:45 PM", type: "Robbery", intensity: 7, coordinates: [28.6139, 77.2090] },
      { location: "Karol Bagh", time: "2:30 AM", type: "Assault", intensity: 6, coordinates: [28.6507, 77.1882] },
      { location: "South Extension", time: "9:15 PM", type: "Snatching", intensity: 5, coordinates: [28.5665, 77.2202] },
      { location: "Old Delhi", time: "11:30 PM", type: "Theft", intensity: 8, coordinates: [28.6562, 77.2315] },
      { location: "Lajpat Nagar", time: "8:00 PM", type: "Chain Snatching", intensity: 6, coordinates: [28.5672, 77.2425] },
      { location: "Paharganj", time: "12:20 AM", type: "Mugging", intensity: 7, coordinates: [28.6434, 77.2150] },
      { location: "Nehru Place", time: "7:45 PM", type: "Pickpocketing", intensity: 5, coordinates: [28.5486, 77.2510] },
      { location: "Saket", time: "6:10 PM", type: "Burglary", intensity: 7, coordinates: [28.5273, 77.2177] },
      { location: "Dwarka Sector 10", time: "9:00 PM", type: "Car Theft", intensity: 6, coordinates: [28.5796, 77.0715] },
      { location: "Janakpuri", time: "10:30 PM", type: "Fraud", intensity: 5, coordinates: [28.6213, 77.0910] }
    ]);
  }, []);

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

      {/* Crime Heatmap */}
      <Content className="px-10 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-8">🛑 Real-Time Crime Heatmap</h2>
        <p className="text-lg text-gray-400 text-center mb-6">AI-powered crime monitoring with real-time alerts.</p>

        <div className="relative w-full h-[500px] rounded-lg border-2 border-gray-700 shadow-xl overflow-hidden">
          <MapContainer center={userLocation} zoom={12} className="w-full h-[500px]">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Recenter Button */}
            <RecenterButton userLocation={userLocation} />

            {/* User's Real-Time Location */}
            <Circle
              center={userLocation}
              pathOptions={{
                color: "blue",
                fillColor: "blue",
                fillOpacity: 0.3,
              }}
              radius={100}
            />
            <Marker position={userLocation} icon={locationIcon}>
              <Popup>📍 You are here</Popup>
            </Marker>

            {/* Show crime locations as glowing markers */}
            {crimeData.map((crime, index) => (
              <React.Fragment key={index}>
                <Circle
                  center={crime.coordinates}
                  pathOptions={{
                    color: "red",
                    fillColor: "red",
                    fillOpacity: 0.3,
                    className: "animate-pulse" // Neon glow effect
                  }}
                  radius={crime.intensity * 100}
                />
                <Marker position={crime.coordinates} icon={locationIcon}>
                  <Popup>
                    <div className="p-2">
                      <h3 className="text-lg font-semibold text-red-600">🚨 {crime.type}</h3>
                      <p className="text-sm"><strong>📍 Location:</strong> {crime.location}</p>
                      <p className="text-sm"><strong>⏳ Time:</strong> {crime.time}</p>
                      <p className="text-sm"><strong>🔥 Intensity:</strong> {crime.intensity}/10</p>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
      </Content>

      {/* Footer */}
      <Footer className="bg-[#112240] text-center text-gray-400 py-6">
        <p>Contact Us: support@vigilantai.com | +123 456 7890</p>
        <p>© 2025 Vigilant AI. All rights reserved.</p>
      </Footer>
    </Layout>
  );
};

export default CrimeHotspotPage;
