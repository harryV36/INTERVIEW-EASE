const DEVICE_ID_KEY = "interviewease_device_id";

export const getDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (deviceId) return deviceId;

  deviceId =
    crypto.randomUUID?.() ||
    `device_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
};
