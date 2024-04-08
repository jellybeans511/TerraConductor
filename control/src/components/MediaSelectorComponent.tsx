import React, { useState, useEffect } from 'react';
import { getCameras, Camera } from '../utils/getMediaDevices';
import { getAudio, Audio } from '../utils/getMediaDevices';

const CameraSelectorComponent: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  const fetchCameras = async () => {
    const cameraList = await getCameras();
    setCameras(cameraList);
    if (cameraList.length > 0) {
      setSelectedCamera(cameraList[0].deviceId);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      fetchCameras(); // 許可後、カメラの一覧を再取得
    } catch (error) {
      console.error("Camera access denied:", error);
    }
  };

  const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCamera(event.target.value);
  };

  return (
    <div>
      <button onClick={requestCameraPermission}>Allow Camera Access</button>
      <select onChange={handleCameraChange} value={selectedCamera}>
        {cameras.map(camera => (
          <option key={camera.deviceId} value={camera.deviceId}>
            {camera.label || 'Unknown Camera'}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CameraSelectorComponent;

