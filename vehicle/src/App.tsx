import React, { useEffect, useState } from 'react';
import './App.css';
import MediaSelectorComponent from './components/MediaSelectorComponent';
import VideoPlayerComponent from './components/VideoPlayerComponent';


function App() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => setStream(stream))
      .catch(err => console.error(err));
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        <MediaSelectorComponent />
        <VideoPlayerComponent stream={stream} />
      </header>
    </div>
  );
}

export default App;
