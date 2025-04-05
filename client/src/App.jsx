import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import CrimeHotspotPage from "./components/CrimeHotspotPage";
import RaiseComplaint from "./components/RaiseComplaint";
import ContactUs from "./components/ContactUs";
import Dashboard from "./components/Dashboard";
import LocationDecoder from "./components/LocationDecoder";
import VideoCapture from "./components/VideoCapture";
import Video from "./components/Video";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/heatmap" element={<CrimeHotspotPage />} />
        <Route path="/complaint" element={<RaiseComplaint />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/location" element={<LocationDecoder />} />
          <Route path="/crime-prediction" element={<Video />} />
        <Route path="/video" element={<VideoCapture />} />
       
      </Routes>
    </Router>
  );
}

export default App;
