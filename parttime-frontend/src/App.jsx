// src/App.jsx
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';

function PrivateRoute({ children, role }) {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Đang tải...</div>;
    if (!user) return <Navigate to="/login" />;
    if (role && user.vai_tro !== role) return <Navigate to="/login" />;
    return children;
}

// Tạo component con nằm BÊN TRONG AuthProvider để gọi useContext an toàn
function AppRoutes() {
    const { loading } = useContext(AuthContext);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#070F1E] text-white">Đang tải hệ thống...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/employee" element={<PrivateRoute role="NHAN_VIEN"><EmployeeDashboard /></PrivateRoute>} />
                <Route path="/manager" element={<PrivateRoute role="QUAN_LY"><ManagerDashboard /></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/login" />} />
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