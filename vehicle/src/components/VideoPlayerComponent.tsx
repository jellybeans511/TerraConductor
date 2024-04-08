import React, { useEffect, useRef } from 'react';


interface VideoPlayerProps {
  stream: MediaStream | null;
}

const VideoPlayerComponent: React.FC<VideoPlayerProps> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);
  

  return <video ref={videoRef} autoPlay muted playsInline></video>;
};

export default VideoPlayerComponent;