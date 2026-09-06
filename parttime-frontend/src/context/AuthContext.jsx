import React, { createContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('vai_tro');
        const name = localStorage.getItem('ho_ten');
        if (token) {
            setUser({ token, vai_tro: role, ho_ten: name });
        }
        setLoading(false);
    }, []);

    const login = async (ma_nhan_vien, mat_khau) => {
        try {
            const response = await axiosClient.post('/login', { ma_nhan_vien, mat_khau });
            const { token, vai_tro, ho_ten } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('vai_tro', vai_tro);
            localStorage.setItem('ho_ten', ho_ten);
            setUser({ token, vai_tro, ho_ten });
            return { success: true };
        } catch (error) {
            // Bắt cả message hoặc error từ backend trả về
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