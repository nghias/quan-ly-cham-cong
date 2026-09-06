// src/App.jsx
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';

// Hàm kiểm tra quyền quản lý an toàn (không phân biệt hoa thường, dấu tiếng Việt hay khoảng trắng)
function checkIsManager(vaiTro) {
    const r = (vaiTro || '').trim().toUpperCase();
    return r === 'QUAN_LY' || r === 'QUẢN LÝ' || r === 'ADMIN' || r === 'MANAGER';
}

function PrivateRoute({ children, requiredType }) {
    const { user, loading } = useContext(AuthContext);
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#070F1E] text-white font-bold">Đang tải hệ thống...</div>;
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const isManager = checkIsManager(user.vai_tro);

    if (requiredType === 'manager' && !isManager) {
        return <Navigate to="/employee" replace />;
    }
    if (requiredType === 'employee' && isManager) {
        return <Navigate to="/manager" replace />;
    }

    return children;
}

function RootRedirect() {
    const { user, loading } = useContext(AuthContext);
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#070F1E] text-white font-bold">Đang tải hệ thống...</div>;
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    if (checkIsManager(user.vai_tro)) {
        return <Navigate to="/manager" replace />;
    }
    return <Navigate to="/employee" replace />;
}

function AppRoutes() {
    const { loading } = useContext(AuthContext);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#070F1E] text-white font-bold">Đang tải hệ thống...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<Login />} />
                <Route path="/employee" element={<PrivateRoute requiredType="employee"><EmployeeDashboard /></PrivateRoute>} />
                <Route path="/manager" element={<PrivateRoute requiredType="manager"><ManagerDashboard /></PrivateRoute>} />
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