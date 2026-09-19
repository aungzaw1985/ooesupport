import axios from 'axios';

const API_URL = 'http://192.168.51.109/api'; // Your NestJS Server IP

const api = axios.create({
  baseURL: API_URL,
});

// Intercept requests to attach the correct JWT token
api.interceptors.request.use((config) => {
  // Check if we are in the portal route
  const isPortal = window.location.pathname.startsWith('/portal');
  
  if (isPortal) {
    const userToken = localStorage.getItem('userToken');
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
  } else {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
});

export default api;