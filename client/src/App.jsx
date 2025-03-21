import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import CrimeHotspotPage from "./components/CrimeHotspotPage";
import RaiseComplaint from "./components/RaiseComplaint";
import ContactUs from "./components/Contactus";
import Dashboard from "./components/Dashboard";
import LocationDecoder from "./components/LocationDecoder";
// import AIVideoConsultation from "./components/AIVideoConsultation";
// import CareerForm from "./components/CareerForm";
// import GetJobs from "./components/GetJobs";
// import CareerPath from "./components/CareerPath";
// import CareerMentor from "./components/CareerMentor";
// import LearningRoadmap from "./components/LearningRoadmap";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/heatmap" element={<CrimeHotspotPage />} />
        <Route path="/complaint" element={<RaiseComplaint />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ai" element={<LocationDecoder />} />
       
      </Routes>
    </Router>
  );
}

export default App;