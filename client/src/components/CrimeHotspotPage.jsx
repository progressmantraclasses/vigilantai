import React, { useEffect, useState, useCallback } from "react";
import { Layout, Menu, Button, Input, message, Spin } from "antd";
import { HomeOutlined, DashboardOutlined, FireOutlined, FileTextOutlined, SafetyOutlined, UserOutlined, PhoneOutlined, AimOutlined, SearchOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";

// Custom Location Marker Icons
const locationIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const startIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3150/3150103.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const endIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2529/2529395.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const { Header, Content, Footer } = Layout;
const { Search } = Input;

// Recenter button component
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

const geocodeLocation = async (locationName) => {
  try {
    // Add "Delhi" to the search query if it's not already included
    const searchQuery = locationName.toLowerCase().includes('delhi') 
      ? locationName 
      : `${locationName}, Delhi`;
      
    // Encode the search query for URL
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Using Nominatim OpenStreetMap API for geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&countrycodes=in`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding API request failed');
    }
    
    const data = await response.json();
    
    // Check if we got any results
    if (data && data.length > 0) {
      const result = data[0];
      
      // Check if the result is actually in Delhi
      const isInDelhi = result.display_name.toLowerCase().includes('delhi');
      
      if (!isInDelhi) {
        return {
          success: false,
          error: 'Location not found in Delhi'
        };
      }
      
      return {
        success: true,
        coordinates: [parseFloat(result.lat), parseFloat(result.lon)],
        formattedAddress: result.display_name
      };
    } else {
      return {
        success: false,
        error: 'Location not found'
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      error: error.message || 'Failed to geocode location'
    };
  }
};
// SafeRoute component that handles routing
const SafeRoute = ({ startPoint, endPoint, crimeData }) => {
  const map = useMap();
  const [route, setRoute] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Function to calculate safe route
  const calculateSafeRoute = useCallback(() => {
    if (!startPoint || !endPoint) return;
    
    setIsCalculating(true);
    
    // Clear existing routes
    if (map.routing) {
      map.removeControl(map.routing);
      map.routing = null;
    }
    
    // Create a cost function that penalizes paths through crime hotspots
    const avoidCrimeHotspots = (routePoints) => {
      // Check if this route passes near any crime hotspots
      let safetyCost = 0;
      
      routePoints.forEach(point => {
        crimeData.forEach(crime => {
          // Calculate distance from route point to crime hotspot
          const distance = L.latLng(point.lat, point.lng).distanceTo(L.latLng(crime.coordinates[0], crime.coordinates[1]));
          
          // If within the crime intensity radius, add penalty based on crime intensity
          const avoidanceRadius = crime.intensity * 150; // Larger radius for more intense crimes
          if (distance < avoidanceRadius) {
            safetyCost += (crime.intensity * 10) * (1 - distance / avoidanceRadius);
          }
        });
      });
      
      return safetyCost;
    };

    // Initialize the routing machine
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(startPoint[0], startPoint[1]),
        L.latLng(endPoint[0], endPoint[1])
      ],
      routeWhileDragging: false,
      showAlternatives: true,
      altLineOptions: {
        styles: [
          { color: 'gray', opacity: 0.6, weight: 4 }
        ]
      },
      lineOptions: {
        styles: [
          { color: '#3388ff', opacity: 0.8, weight: 6 }
        ],
        addWaypoints: false
      },
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'foot' // Using walking profile for more detailed routing
      }),
      createMarker: () => null // Don't create markers for waypoints
    }).addTo(map);
    
    // Store in map instance to be able to remove it later
    map.routing = routingControl;

    // Process routes when they're calculated
    routingControl.on('routesfound', (e) => {
      // Calculate safety score for each route
      const routes = e.routes.map(route => {
        const coordinates = route.coordinates;
        const routePoints = coordinates.map(coord => ({ lat: coord.lat, lng: coord.lng }));
        const safetyCost = avoidCrimeHotspots(routePoints);
        
        return {
          ...route,
          safetyCost,
          // Convert to proper format for Polyline
          latlngs: coordinates.map(coord => [coord.lat, coord.lng])
        };
      });
      
      // Sort routes by safety (lowest cost first)
      routes.sort((a, b) => a.safetyCost - b.safetyCost);
      
      // Select the safest route
      const safestRoute = routes[0];
      setRoute(safestRoute);
      
      // Update the routing control to show only the safest route
      routingControl.setWaypoints([
        L.latLng(startPoint[0], startPoint[1]),
        L.latLng(endPoint[0], endPoint[1])
      ]);
      
      message.success("Safest route calculated successfully!");
      setIsCalculating(false);
    });
    
    routingControl.on('routingerror', (e) => {
      console.error('Routing error:', e.error);
      message.error("Failed to calculate route. Please try again.");
      setIsCalculating(false);
    });
  }, [map, startPoint, endPoint, crimeData]);

  // Calculate route when start or end points change
  useEffect(() => {
    if (startPoint && endPoint) {
      calculateSafeRoute();
    }
  }, [startPoint, endPoint, calculateSafeRoute]);

  // Render safe route polyline
  return (
    <>
      {isCalculating && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white p-4 rounded-md shadow-lg">
          <Spin tip="Calculating safest route..." />
        </div>
      )}
      
      {route && (
        <Polyline
          positions={route.latlngs}
          pathOptions={{ color: '#4CAF50', weight: 6, opacity: 0.8 }}
        >
          <Popup>
            <div>
              <strong>🛡️ Safest Route</strong>
              <p>Distance: {(route.summary.totalDistance / 1000).toFixed(2)} km</p>
              <p>Estimated Time: {Math.ceil(route.summary.totalTime / 60)} minutes</p>
              <p>Safety Score: {(100 - Math.min(route.safetyCost, 100)).toFixed(0)}%</p>
            </div>
          </Popup>
        </Polyline>
      )}
    </>
  );
};

// Mock geocoding service (replace with your actual location to coordinate converter)


const CrimeHotspotPage = () => {
  const navigate = useNavigate();
  const [crimeData, setCrimeData] = useState([]);
  const [userLocation, setUserLocation] = useState([28.6139, 77.2090]); // Default: Connaught Place, Delhi
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [startLocationInput, setStartLocationInput] = useState("");
  const [endLocationInput, setEndLocationInput] = useState("");
  const [startLocationName, setStartLocationName] = useState("");
  const [endLocationName, setEndLocationName] = useState("");
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [isSearchingEnd, setIsSearchingEnd] = useState(false);
  const [map, setMap] = useState(null);

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
    const dummyCrimeData = [
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
    ];
    
    setCrimeData(dummyCrimeData);
  }, []);

  // Function to check if a location is in a crime hotspot
  const isInCrimeHotspot = (coordinates) => {
    for (const crime of crimeData) {
      const distance = L.latLng(coordinates[0], coordinates[1])
        .distanceTo(L.latLng(crime.coordinates[0], crime.coordinates[1]));
      
      // Check if location is within the crime's intensity radius
      if (distance < crime.intensity * 100) {
        return {
          inHotspot: true,
          crime: crime
        };
      }
    }
    return { inHotspot: false };
  };

  // Handle searching and setting start location
  const handleSearchStartLocation = async (value) => {
    if (!value.trim()) return;
    
    setIsSearchingStart(true);
    
    try {
      // Use your location-to-coordinate converter here
      const result = await geocodeLocation(value);
      
      if (result.success) {
        // Check if location is in a crime hotspot
        const hotspotCheck = isInCrimeHotspot(result.coordinates);
        
        if (hotspotCheck.inHotspot) {
          message.warning(
            `Warning: The starting point "${result.formattedAddress}" is in a high-crime area (${hotspotCheck.crime.type}). Consider choosing a safer location.`,
            5
          );
        }
        
        setStartPoint(result.coordinates);
        setStartLocationName(result.formattedAddress);
        if (map) map.flyTo(result.coordinates, 14);
      } else {
        message.error("Couldn't find that location in Delhi. Please try another location.");
      }
    } catch (error) {
      console.error("Error geocoding:", error);
      message.error("Error finding location. Please try again.");
    } finally {
      setIsSearchingStart(false);
    }
  };

  // Handle searching and setting end location
  const handleSearchEndLocation = async (value) => {
    if (!value.trim()) return;
    
    setIsSearchingEnd(true);
    
    try {
      // Use your location-to-coordinate converter here
      const result = await geocodeLocation(value);
      
      if (result.success) {
        // Check if location is in a crime hotspot
        const hotspotCheck = isInCrimeHotspot(result.coordinates);
        
        if (hotspotCheck.inHotspot) {
          message.warning(
            `Warning: The destination "${result.formattedAddress}" is in a high-crime area (${hotspotCheck.crime.type}). Consider choosing a safer location.`,
            5
          );
        }
        
        setEndPoint(result.coordinates);
        setEndLocationName(result.formattedAddress);
        if (map) map.flyTo(result.coordinates, 14);
      } else {
        message.error("Couldn't find that location in Delhi. Please try another location.");
      }
    } catch (error) {
      console.error("Error geocoding:", error);
      message.error("Error finding location. Please try again.");
    } finally {
      setIsSearchingEnd(false);
    }
  };

  // Use current location as starting point
  const useCurrentLocation = () => {
    setStartPoint(userLocation);
    setStartLocationName("Your Current Location");
    setStartLocationInput("Your Current Location");
    if (map) map.flyTo(userLocation, 14);
    message.success("Using your current location as starting point");
  };

  // Save map reference
  const MapRef = ({ setMapRef }) => {
    const map = useMap();
    useEffect(() => {
      setMapRef(map);
    }, [map, setMapRef]);
    return null;
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

      {/* Crime Heatmap & Route Controls */}
      <Content className="px-10 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-8">🛑 Real-Time Crime Heatmap</h2>
        <p className="text-lg text-gray-400 text-center mb-6">AI-powered crime monitoring with safe route planning.</p>

        {/* Route Selection Controls */}
        <div className="bg-[#112240] p-6 rounded-lg shadow-lg mb-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4">🛡️ Find Safest Route</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-2">Start Location:</label>
              <div className="flex space-x-2">
                <Search
                  placeholder="Type starting location"
                  value={startLocationInput}
                  onChange={(e) => setStartLocationInput(e.target.value)}
                  onSearch={handleSearchStartLocation}
                  loading={isSearchingStart}
                  enterButton={<SearchOutlined />}
                  className="flex-1"
                />
                <Button 
                  type="primary" 
                  onClick={useCurrentLocation}
                  className="bg-blue-500"
                >
                  Use My Location
                </Button>
              </div>
              {startLocationName && (
                <div className="mt-2 text-green-400">
                  <span>Set to: {startLocationName}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-gray-400 mb-2">End Location:</label>
              <Search
                placeholder="Type destination location"
                value={endLocationInput}
                onChange={(e) => setEndLocationInput(e.target.value)}
                onSearch={handleSearchEndLocation}
                loading={isSearchingEnd}
                enterButton={<SearchOutlined />}
                className="w-full"
              />
              {endLocationName && (
                <div className="mt-2 text-green-400">
                  <span>Set to: {endLocationName}</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 text-gray-400 text-sm">
            <p>🔰 Type any location in Delhi (e.g., "India Gate", "Connaught Place", "Janpath", etc.)</p>
            <p>🔰 The system will calculate the safest route by avoiding high-crime areas.</p>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-[600px] rounded-lg border-2 border-gray-700 shadow-xl overflow-hidden">
          <MapContainer center={userLocation} zoom={12} className="w-full h-[600px]">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapRef setMapRef={setMap} />

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

            {/* Display start and end markers if selected */}
            {startPoint && (
              <Marker position={startPoint} icon={startIcon}>
                <Popup>Starting Point: {startLocationName}</Popup>
              </Marker>
            )}
            
            {endPoint && (
              <Marker position={endPoint} icon={endIcon}>
                <Popup>Destination: {endLocationName}</Popup>
              </Marker>
            )}

            {/* Safe Route Component */}
            {startPoint && endPoint && (
              <SafeRoute 
                startPoint={startPoint} 
                endPoint={endPoint} 
                crimeData={crimeData} 
              />
            )}
          </MapContainer>
        </div>
        
        {/* Map Legend */}
        <div className="mt-4 bg-[#112240] p-4 rounded-lg border border-gray-700">
          <h4 className="font-medium text-lg mb-2">Map Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span>Your Location</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span>Crime Hotspot</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 mr-2"></div>
              <span>Safe Route</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-500 mr-2"></div>
              <span>Alternative Routes</span>
            </div>
          </div>
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