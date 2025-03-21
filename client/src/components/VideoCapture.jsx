import React, { useState } from 'react';
import axios from 'axios';

const VideoUploader = () => {
  const [video, setVideo] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  const handleVideoChange = (event) => {
    setVideo(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!video) {
      setError("Please upload a video file");
      return;
    }

    const formData = new FormData();
    formData.append('video', video);

    try {
      const response = await axios.post('http://127.0.0.1:5000/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPrediction(response.data.predicted_class);
    } catch (error) {
      setError("Error while processing the video.");
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Upload Video for Crime Prediction</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoChange}
        />
        <button type="submit">Submit</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {prediction && <p>Predicted Crime Class: {prediction}</p>}
    </div>
  );
};

export default VideoUploader;
