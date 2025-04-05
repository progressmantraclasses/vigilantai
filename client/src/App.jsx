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
import Avtar from "./components/Avtar";
import FitbitIntegration from "./components/WearableDevice";
import IncidentForm from "./components/IncidentForm";
import IncidentViewer from "./components/IncidentViewer";

function App() {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminAddress, setAdminAddress] = useState("");

  useEffect(() => {
    const initialize = async () => {
      try {
        const web3Instance = await getWeb3();
        setWeb3(web3Instance);

        const accounts = await web3Instance.eth.getAccounts();
        setAccounts(accounts);

        const { instance } = await getContract(web3Instance);
        setContract(instance);

        const admin = await instance.methods.admin().call();
        setAdminAddress(admin);
      } catch (error) {
        console.error("Failed to load web3, accounts, or contract:", error);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  if (error) return <div className="error">{error}</div>;

  return (
    <Router>
       <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/heatmap" element={<CrimeHotspotPage />} />
        <Route path="/complaint" element={<RaiseComplaint />} />
        <Route path="/contact" element={<ContactUs />} />
         <Route path="/legal-assistance" element={<Avtar />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/location" element={<LocationDecoder />} />
          <Route path="/crime-prediction" element={<Video />} />
        <Route path="/video" element={<VideoCapture />} />
         <Route path="/wearable" element={<FitbitIntegration />} />
        
          <Route
            path="/blockchain"
            element={
              <div className="container">
                <IncidentForm  />
                <IncidentViewer />
              </div>
            }
          />
       
      </Routes>
      </div>
    </Router>
  );
}

export default App;
