// src/utils/getCameras.ts

export interface MediaDevice {
  label: string;
  deviceId: string;
  kind: string;
}

// 利用可能なメディアデバイスの一覧を取得する関数
export const getMediaDevices = async (): Promise<MediaDevice[]> => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log('enumerateDevices() not supported.');
    return [];
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  const mediaDevices = devices.filter(device => device.kind === 'videoinput' || device.kind === 'audioinput').map(device => ({
    label: device.label,
    deviceId: device.deviceId,
    kind: device.kind
  }));

  return mediaDevices;
};