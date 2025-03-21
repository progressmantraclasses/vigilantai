import React, { useState } from "react";
import axios from "axios";

const LocationForm = () => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!latitude || !longitude) {
      setError("Please enter both latitude and longitude.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`http://localhost:5000/api/reverse-geocode?lat=${latitude}&lon=${longitude}`);
      setAddress(res.data.address);
    } catch (err) {
      setError("Failed to fetch location.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A192F] text-white p-6">
      <h2 className="text-3xl font-bold mb-6">🌍 Get Address from Coordinates</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-[#112240] p-6 rounded-lg shadow-lg w-full max-w-md">
        <label className="block mb-2">
          Latitude:
          <input
            type="text"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
            className="w-full p-2 mt-1 rounded text-black"
          />
        </label>

        <label className="block mb-4">
          Longitude:
          <input
            type="text"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
            className="w-full p-2 mt-1 rounded text-black"
          />
        </label>

        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded w-full">
          🔍 Get Address
        </button>
      </form>

      {/* Show Address or Errors */}
      <div className="mt-6 bg-[#112240] p-4 rounded-lg shadow-lg w-full max-w-md">
        {loading ? (
          <p className="text-yellow-400">Fetching location...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : address ? (
          <p className="text-green-400"><strong>📍 Address:</strong> {address}</p>
        ) : (
          <p className="text-gray-400">Enter coordinates to get the address.</p>
        )}
      </div>
    </div>
  );
};

export default LocationForm;
