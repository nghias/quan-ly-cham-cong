// src/App.jsx
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';

function PrivateRoute({ children, role }) {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#070F1E] text-white">Đang tải...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (role && user.vai_tro !== role) return <Navigate to="/login" replace />;
    return children;
}

// Kiểm tra nếu đã đăng nhập thì tự động chuyển đến Dashboard tương ứng
function RootRedirect() {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#070F1E] text-white">Đang tải hệ thống...</div>;
    
    if (!user) return <Navigate to="/login" replace />;
    
    const role = (user.vai_tro || '').trim().toUpperCase();
    if (role === 'QUAN_LY' || role === 'QUẢN LÝ' || role === 'ADMIN' || role === 'MANAGER') {
        return <Navigate to="/manager" replace />;
    }
    return <Navigate to="/employee" replace />;
}

function AppRoutes() {
    const { loading } = useContext(AuthContext);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#070F1E] text-white">Đang tải hệ thống...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<Login />} />
                <Route path="/employee" element={<PrivateRoute role="NHAN_VIEN"><EmployeeDashboard /></PrivateRoute>} />
                <Route path="/manager" element={<PrivateRoute role="QUAN_LY"><ManagerDashboard /></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}