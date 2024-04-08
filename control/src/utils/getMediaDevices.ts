// src/utils/getCameras.ts

export interface Camera {
    label: string;
    deviceId: string;
  }


  export interface Audio {
    label: string;
    deviceId: string;
  }

  
  // 利用可能なカメラの一覧を取得する関数
  export const getCameras = async (): Promise<Camera[]> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log('enumerateDevices() not supported.');
      return [];
    }
  
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput').map(device => ({
      label: device.label,
      deviceId: device.deviceId
    }));
  
    return videoDevices;
  };
  
  export const getAudio = async (): Promise<Audio[]> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log('enumerateDevices() not supported.');
      return [];
    }
  
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(device => device.kind === 'audioinput').map(device => ({
      label: device.label,
      deviceId: device.deviceId
    }));
  
    return audioDevices;
  }