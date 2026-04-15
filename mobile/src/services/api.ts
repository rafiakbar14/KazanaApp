import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://kazana.web.id/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to handle cookies manually if needed (React Native specific)
api.interceptors.request.use(async (config) => {
  const cookie = await AsyncStorage.getItem('user_cookie');
  if (cookie) {
    config.headers.Cookie = cookie;
  }
  return config;
});

api.interceptors.response.use((response) => {
  // Try to capture connect.sid cookie from headers
  const setCookie = response.headers['set-cookie'];
  if (setCookie) {
    const sid = setCookie.find(c => c.startsWith('connect.sid'));
    if (sid) {
      AsyncStorage.setItem('user_cookie', sid);
    }
  }
  return response;
});

export default api;
