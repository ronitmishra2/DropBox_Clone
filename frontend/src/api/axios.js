import axios from 'axios';

// Create a custom Axios instance
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:5000/api', // Pointing to your Flask backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Automatically attach the JWT token to every request if we have one
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;