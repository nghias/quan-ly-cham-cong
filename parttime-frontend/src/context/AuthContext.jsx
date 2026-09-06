import React, { createContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const expiryTime = localStorage.getItem('token_expiry');
        const role = localStorage.getItem('vai_tro');
        const name = localStorage.getItem('ho_ten');

        if (token && expiryTime) {
            const now = new Date().getTime();
            // Kiểm tra xem token đã quá hạn 60 ngày chưa
            if (now < parseInt(expiryTime, 10)) {
                setUser({ token, vai_tro: role, ho_ten: name });
            } else {
                // Hết hạn thì tự động xóa
                localStorage.clear();
            }
        }
        setLoading(false);
    }, []);

    const login = async (ma_nhan_vien, mat_khau, rememberMe) => {
        try {
            const response = await axiosClient.post('/login', { ma_nhan_vien, mat_khau });
            const { token, vai_tro, ho_ten } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('vai_tro', vai_tro);
            localStorage.setItem('ho_ten', ho_ten);

            // Nếu chọn ghi nhớ đăng nhập, thời gian sống là 60 ngày. Ngược lại hết phiên trình duyệt (hoặc 1 ngày tùy ý)
            const days = rememberMe ? 60 : 1; 
            const expiryTime = new Date().getTime() + days * 24 * 60 * 60 * 1000;
            localStorage.setItem('token_expiry', expiryTime);

            setUser({ token, vai_tro, ho_ten });
            return { success: true };
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Đăng nhập thất bại';
            return { success: false, message: errorMsg };
        }
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};