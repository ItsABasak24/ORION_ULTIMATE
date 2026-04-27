
import axios from 'axios';

const DOMAIN = import.meta.env.VITE_DOMAIN;
const API_BASE = `${DOMAIN}/orion/api/v1`;

export const postUpload = async (userId, fileUrl, token) => {
  return axios.post(
    `${API_BASE}/upload`,
    { userid: userId, url: fileUrl },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const checkUploadStatus = async (sessionId, token) => {
  return axios.post(
    `${API_BASE}/upload-status`,
    { sessionid: sessionId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};