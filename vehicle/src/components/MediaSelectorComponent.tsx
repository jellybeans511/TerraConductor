import React, { useState, useEffect } from 'react';
import { getMediaDevices, MediaDevice } from '../utils/getMediaDevices';

const MediaSelectorComponent: React.FC = () => {
  const [devices, setDevices] = useState<MediaDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [videoEnabled, setVideoEnabled] = useState<boolean>(true);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  const fetchDevices = async () => {
    const deviceList = await getMediaDevices();
    setDevices(deviceList);
    const firstCamera = deviceList.find(device => device.kind === 'videoinput');
    if (firstCamera) {
      setSelectedCamera(firstCamera.deviceId);
    }
    const firstMicrophone = deviceList.find(device => device.kind === 'audioinput');
    if (firstMicrophone) {
      setSelectedMicrophone(firstMicrophone.deviceId);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const requestMediaPermission = async () => {
    try {
      const constraints = { video: videoEnabled, audio: audioEnabled };
      await navigator.mediaDevices.getUserMedia(constraints);
      fetchDevices(); // 許可後、デバイスの一覧を再取得
    } catch (error) {
      console.error("Media access denied:", error);
    }
  };

  const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCamera(event.target.value);
  };

  const handleMicrophoneChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMicrophone(event.target.value);
  };

  return (
    <div>
    
      <fieldset>
        <legend>Video</legend>
        <label>
          <input
            type="radio"
            name="video"
            value="true"
            checked={videoEnabled}
            onChange={() => setVideoEnabled(true)}
          /> Enabled
        </label>
        <label>
          <input
            type="radio"
            name="video"
            value="false"
            checked={!videoEnabled}
            onChange={() => setVideoEnabled(false)}
          /> Disabled
        </label>
        <br></br>
        <label>Camera:</label>
        <select onChange={handleCameraChange} value={selectedCamera}>
          {devices.filter(device => device.kind === 'videoinput').map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || 'Unknown Camera'}
            </option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend>Audio</legend>
        <label>
          <input
            type="radio"
            name="audio"
            value="true"
            checked={audioEnabled}
            onChange={() => setAudioEnabled(true)}
          /> Enabled
        </label>
        <label>
          <input
            type="radio"
            name="audio"
            value="false"
            checked={!audioEnabled}
            onChange={() => setAudioEnabled(false)}
          /> Disabled
        </label>
        <br></br>
        <label>Microphone:</label>
        <select onChange={handleMicrophoneChange} value={selectedMicrophone}>
          {devices.filter(device => device.kind === 'audioinput').map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || 'Unknown Microphone'}
            </option>
          ))}
        </select>
      </fieldset>
      <button onClick={requestMediaPermission}>Allow Media Access</button>
    </div>

    
  );
};

export default MediaSelectorComponent;
