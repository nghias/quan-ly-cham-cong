import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';


export default function Login() {
    const [maNhanVien, setMaNhanVien] = useState('');
    const [matKhau, setMatKhau] = useState('');
    const [rememberMe, setRememberMe] = useState(true); // Mặc định bật ghi nhớ
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(maNhanVien, matKhau, rememberMe);
        if (res.success) {
            const role = localStorage.getItem('vai_tro');
            if (role === 'QUAN_LY') navigate('/manager');
            else navigate('/employee');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#070F1E] px-4 relative overflow-hidden select-none">
            
            {/* HIỆU ỨNG ÁNH SÁNG NEON NỀN (GAMING VIBE) */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FFD166]/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* LƯỚI ĐỒ HỌA NỀN MỜ (GRID PATTERN) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d_1px,transparent_1px),linear-gradient(to_bottom,#1f293d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

            <div className="max-w-md w-full bg-[#0B1E3F]/80 backdrop-blur-xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 sm:p-10 border border-white/10 relative z-10">
                
                {/* LOGO & HEADER */}
                <div className="text-center mb-6 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#FFD166]/20 blur-xl rounded-full"></div>
                    
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0B1E3F] to-[#1D3557] text-[#FFD166] rounded-2xl shadow-xl mb-4 border-2 border-[#FFD166]/50 relative group hover:scale-105 transition-transform">
                        <Gamepad2 size={42} className="drop-shadow-[0_0_10px_rgba(255,209,102,0.5)] animate-pulse" />
                        <div className="absolute -bottom-1 -right-1 bg-[#FFD166] text-[#0B1E3F] p-1 rounded-lg shadow">
                            <Sparkles size={12} strokeWidth={3} />
                        </div>
                    </div>

                    <h1 className="text-3xl font-black text-white tracking-wider drop-shadow-md">
                        SUNDAY <span className="text-[#FFD166]">GAME</span>
                    </h1>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        Quản Lý Lịch làm & Lương 
                    </p>
                </div>

                {error && (
                    <div className="mb-5 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-xs font-semibold rounded-xl text-center backdrop-blur-sm animate-shake">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    
                    {/* Ô NHẬP MÃ NHÂN VIÊN */}
                    <div>
                        <label className="block text-[11px] font-extrabold text-gray-300 uppercase tracking-wider mb-1.5">Mã Nhân Viên</label>
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-[#FFD166] transition-colors">
                                <User size={18} />
                            </span>
                            <input 
                                type="text" 
                                required
                                value={maNhanVien}
                                onChange={(e) => setMaNhanVien(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-500 text-sm font-bold focus:ring-2 focus:ring-[#FFD166] focus:border-transparent outline-none transition-all shadow-inner"
                                placeholder="VD: 24010172"
                            />
                        </div>
                    </div>

                    {/* Ô NHẬP MẬT KHẨU & NÚT ẨN HIỆN */}
                    <div>
                        <label className="block text-[11px] font-extrabold text-gray-300 uppercase tracking-wider mb-1.5">Mật Khẩu</label>
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-[#FFD166] transition-colors">
                                <Lock size={18} />
                            </span>
                            <input 
                                type={showPassword ? "text" : "password"}
                                required
                                value={matKhau}
                                onChange={(e) => setMatKhau(e.target.value)}
                                className="w-full pl-11 pr-12 py-3 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-500 text-sm font-bold focus:ring-2 focus:ring-[#FFD166] focus:border-transparent outline-none transition-all shadow-inner tracking-widest"
                                placeholder="••••••••"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* CHECKBOX GHI NHỚ ĐĂNG NHẬP 60 NGÀY */}
                    <div className="flex items-center justify-between text-xs pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-gray-300 hover:text-white transition-colors">
                            <input 
                                type="checkbox" 
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 accent-[#FFD166] rounded cursor-pointer"
                            />
                            <span className="font-semibold">Ghi nhớ đăng nhập (60 ngày)</span>
                        </label>
                    </div>

                    {/* NÚT SUBMIT */}
                    <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-[#FFD166] to-amber-400 hover:from-amber-400 hover:to-[#FFD166] text-[#0B1E3F] font-black py-3.5 rounded-2xl shadow-[0_4px_20px_rgba(255,209,102,0.3)] hover:shadow-[0_4px_25px_rgba(255,209,102,0.5)] active:scale-[0.98] transition-all duration-200 text-sm tracking-wider uppercase mt-2 cursor-pointer"
                    >
                        Đăng Nhập Ngay 🚀
                    </button>
                </form>

                {/* FOOTER NHỎ TRANG TRÍ */}
                <div className="mt-6 text-center border-t border-white/5 pt-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                        © SUNDAY GAME
                    </p>
                </div>

            </div>
        </div>
    );
}