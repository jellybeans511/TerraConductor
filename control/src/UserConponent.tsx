import React, { useEffect, useState } from 'react';

const CameraSelector = () => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>();

  useEffect(() => {
    const populateCameras = async () => {
      if (!('mediaDevices' in navigator) || !navigator.mediaDevices.enumerateDevices) {
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);

      // 初期選択カメラの設定 (デフォルトまたは既存の選択)
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    };

    populateCameras();
  }, []);

  const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCamera(event.target.value);
  };

  return (
    <select onChange={handleCameraChange} value={selectedCamera} disabled={cameras.length === 0}>
      <option id="default" value="">(default camera)</option>
      {cameras.map((camera, index) => (
        <option key={camera.deviceId} id={camera.deviceId} value={camera.deviceId}>
          {camera.label || `Camera ${index + 1}`}
        </option>
      ))}
    </select>
  );
};

export default CameraSelector;
