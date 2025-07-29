import axios from 'axios';

export const API_BASE_URL = "https://backend.petsgallerydubai.com/api";
export const IMAGE_BASE_URL = "https://backend.petsgallerydubai.com/storage";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Add interceptor to attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // or sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
