import axios from 'axios';
import { io } from 'socket.io-client';

// URL backend
const API_URL = 'http://localhost:5000/api';

// Axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Thêm token vào header cho mọi request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Socket.io client
let socket = null;

export const connectSocket = () => {
    const token = localStorage.getItem('token');
    if (!token || socket) return;

    socket = io('http://localhost:5000', {
        auth: { token },
    });

    socket.on('connect', () => console.log('Socket connected'));
    socket.on('disconnect', () => console.log('Socket disconnected'));
};

export const getSocket = () => socket;

export default api;