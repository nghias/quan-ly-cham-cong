import axios from 'axios';

const axiosClient = axios.create({
    // Nếu có biến môi trường trên Vercel thì lấy, không thì mặc định localhost khi chạy dưới máy tính
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Thêm interceptor gắn token tự động (giữ nguyên logic cũ của bạn)
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

export default axiosClient;