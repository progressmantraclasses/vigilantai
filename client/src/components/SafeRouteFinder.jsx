import React, { useEffect, useState } from "react";
import { Layout, Menu, Input, Button, notification } from "antd";
import { HomeOutlined, DashboardOutlined, FireOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ORS_API_KEY = "5b3ce3597851110001cf6248f19e6b13145048fe9f96e65ce3677ca4"; // Get this from OpenRouteService

const { Header, Content, Footer } = Layout;

// Custom location marker icon
const locationIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const SafeRouteFinder = () => {
  const navigate = useNavigate();
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [safeRoute, setSafeRoute] = useState([]);
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [directions, setDirections] = useState([]);

  // Function to get coordinates from location name
  const getCoordinates = async (location) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${location}`
    );
    const data = await response.json();
    if (data.length === 0) {
      notification.error({ message: `Location '${location}' not found!` });
      return null;
    }
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  };

  // Function to find the safest route
  const findSafeRoute = async () => {
    if (!startLocation || !endLocation) {
      notification.error({ message: "Please enter both locations!" });
      return;
    }

    const start = await getCoordinates(startLocation);
    const end = await getCoordinates(endLocation);

    if (!start || !end) return;

    setStartCoords(start);
    setEndCoords(end);

    // Fetch route directions from OpenRouteService
    const routeURL = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`;

    try {
      const routeResponse = await fetch(routeURL);
      const routeData = await routeResponse.json();

      if (routeData.routes && routeData.routes.length > 0) {
        const routeCoords = routeData.routes[0].geometry.coordinates.map(
          (coord) => [coord[1], coord[0]]
        );

        setSafeRoute(routeCoords);

        // Extract step-by-step directions
        const steps = routeData.routes[0].segments[0].steps.map((step) => ({
          instruction: step.instruction,
          distance: step.distance.toFixed(1),
          duration: (step.duration / 60).toFixed(1),
        }));

        setDirections(steps);

        notification.success({ message: "Safe route calculated!" });
      } else {
        notification.error({ message: "Failed to calculate route. Try again!" });
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      notification.error({ message: "API Error. Try again later!" });
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
          ].map((item) => (
            <Menu.Item
              key={item.key}
              icon={item.icon}
              onClick={item.onClick}
              className="relative group cursor-pointer"
            >
              {item.label}
              <motion.div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300" />
            </Menu.Item>
          ))}
        </Menu>
      </Header>

      {/* Safe Route Finder */}
      <Content className="px-10 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-8">🛣️ Safe Route Finder</h2>
        <p className="text-lg text-gray-400 text-center mb-6">Find the safest route between two locations.</p>

        {/* Input Fields */}
        <div className="flex justify-center gap-4 mb-6">
          <Input
            className="bg-gray-800 text-white border-none px-4 py-2 rounded-md w-1/3"
            placeholder="Enter Start Location"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
          />
          <Input
            className="bg-gray-800 text-white border-none px-4 py-2 rounded-md w-1/3"
            placeholder="Enter Destination"
            value={endLocation}
            onChange={(e) => setEndLocation(e.target.value)}
          />
          <Button className="bg-blue-500 text-white px-6 py-2 rounded-md" onClick={findSafeRoute}>
            Find Route
          </Button>
        </div>

        {/* Map Section */}
        <div className="relative w-full h-[500px] border-2 border-gray-700 rounded-lg shadow-xl overflow-hidden">
          <MapContainer center={[28.7041, 77.1025]} zoom={12} className="w-full h-[500px]">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Start & End Markers */}
            {startCoords && (
              <Marker position={startCoords} icon={locationIcon}>
                <Popup>📍 Start: {startLocation}</Popup>
              </Marker>
            )}
            {endCoords && (
              <Marker position={endCoords} icon={locationIcon}>
                <Popup>📍 Destination: {endLocation}</Popup>
              </Marker>
            )}

            {/* Safe Route */}
            {safeRoute.length > 0 && (
              <Polyline positions={safeRoute} pathOptions={{ color: "red", weight: 5, opacity: 0.8 }} />
            )}
          </MapContainer>
        </div>

        {/* Turn-by-Turn Directions */}
        {directions.length > 0 && (
          <div className="mt-6 p-4 bg-gray-900 rounded-md shadow-md">
            <h3 className="text-lg font-semibold text-white mb-2">🔄 Turn-by-Turn Directions</h3>
            <ul className="text-gray-400">
              {directions.map((step, index) => (
                <li key={index}>➡️ {step.instruction} ({step.distance}m, {step.duration} min)</li>
              ))}
            </ul>
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default SafeRouteFinder;
