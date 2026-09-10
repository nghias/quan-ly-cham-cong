import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Users, CalendarCheck, Wallet, ChevronLeft, ChevronRight, Menu, User, Key, X, Save, CheckCircle2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';

// Import 3 Component con
import UsersTab from '../components/manager/UsersTab';
import ScheduleTab from '../components/manager/ScheduleTab';
import BudgetTab from '../components/manager/BudgetTab';

// Hàm tự động sinh danh sách tuần (chỉ gọi 1 lần)
const generateDynamicWeeks = () => {
    const weeks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDay = today.getDay();
    const diffToMonday = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const currentMonday = new Date(today);
    currentMonday.setDate(diffToMonday);

    const PAST_WEEKS = 3;
    const FUTURE_WEEKS = 3;
    let defaultCurrentIdx = 0;

    for (let i = -PAST_WEEKS; i <= FUTURE_WEEKS; i++) {
        const startOfWeek = new Date(currentMonday);
        startOfWeek.setDate(currentMonday.getDate() + (i * 7));

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const formatDate = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const formatLabel = (start, end) => {
            const startD = String(start.getDate()).padStart(2, '0');
            const startM = String(start.getMonth() + 1).padStart(2, '0');
            const endD = String(end.getDate()).padStart(2, '0');
            const endM = String(end.getMonth() + 1).padStart(2, '0');
            const endY = end.getFullYear();
            return `${startD}/${startM} - ${endD}/${endM}/${endY}`;
        };

        weeks.push({
            start: formatDate(startOfWeek),
            end: formatDate(endOfWeek),
            label: formatLabel(startOfWeek, endOfWeek)
        });

        if (i === 0) {
            defaultCurrentIdx = weeks.length - 1;
        }
    }
    return { weeks, defaultCurrentIdx };
};

export default function ManagerDashboard() {
    const { logout, user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('schedule');
    
    const { weeksList, initialWeekIdx } = useMemo(() => {
        const data = generateDynamicWeeks();
        return { weeksList: data.weeks, initialWeekIdx: data.defaultCurrentIdx };
    }, []);

    const [currentWeekIdx, setCurrentWeekIdx] = useState(initialWeekIdx);

    // ---------------- STATE CHO DROPDOWN & MODALS ----------------
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const menuRef = useRef(null);

    // Profile Form
    const [profileForm, setProfileForm] = useState({ id: '', ho_ten: '', so_dien_thoai: '', ma_nhan_vien: '', vai_tro: '' });
    // Password Form
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ---------------- HÀM XỬ LÝ PROFILE ----------------
    const openProfileModal = async () => {
        setIsMenuOpen(false);
        try {
            const res = await axiosClient.get('/me'); 
            setProfileForm({
                id: res.data.id,
                ho_ten: res.data.ho_ten || '',
                so_dien_thoai: res.data.so_dien_thoai || '',
                ma_nhan_vien: res.data.ma_nhan_vien || '',
                vai_tro: res.data.vai_tro || ''
            });
            setIsProfileModalOpen(true);
        } catch (error) {
            alert("Lỗi khi tải thông tin tài khoản");
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.put(`/users/${profileForm.id}`, {
                ho_ten: profileForm.ho_ten,
                so_dien_thoai: profileForm.so_dien_thoai,
                vai_tro: profileForm.vai_tro 
            });
            alert("Cập nhật thông tin thành công!");
            setIsProfileModalOpen(false);
            localStorage.setItem('ho_ten', profileForm.ho_ten); 
            window.location.reload(); 
        } catch (error) {
            alert("Cập nhật thất bại: " + (error.response?.data?.error || error.message));
        }
    };

    // ---------------- HÀM XỬ LÝ PASSWORD ----------------
    const openPasswordModal = () => {
        setIsMenuOpen(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setIsPasswordModalOpen(true);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert("Mật khẩu xác nhận không khớp!");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
            return;
        }

        try {
            await axiosClient.put('/change-password', {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            });
            alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
            setIsPasswordModalOpen(false);
            logout(); 
        } catch (error) {
            alert("Đổi mật khẩu thất bại: " + (error.response?.data?.error || error.message));
        }
    };

    if (weeksList.length === 0) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            
            {/* HEADER DÍNH (STICKY) */}
            <header className="bg-[#0B1E3F] text-white shadow-lg sticky top-0 z-40">
                <div className="max-w-[1920px] mx-auto px-4">
                    <div className="flex flex-wrap items-center justify-between py-3 gap-y-3 relative">
                        
                        {/* 1. TRÁI CÙNG: LOGO & TÊN BRAND */}
                        <div className="flex items-center gap-3">
                            <img 
                                src="/logo.jpg" 
                                alt="SundayGame Logo" 
                                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border-2 border-white/10 shadow-sm bg-white"
                            />
                            <div className="hidden sm:block">
                                <h1 className="text-sm font-black tracking-wide uppercase leading-none text-white">
                                    Sunday Game
                                </h1>
                                <span className="text-[10px] font-bold text-[#FFD166] uppercase tracking-widest mt-1 block">
                                    Hệ Thống Quản Lý
                                </span>
                            </div>
                        </div>

                        {/* 2. Ở GIỮA: CỤM ĐIỀU KHIỂN */}
                        <div className="w-full md:w-auto order-last md:order-none flex justify-center">
                            <div className="flex items-center bg-white/10 p-1 rounded-xl shadow-inner w-full sm:w-auto overflow-x-auto hide-scrollbar">
                                {[
                                    { id: 'users', icon: <Users size={16}/>, label: 'Nhân Sự' },
                                    { id: 'schedule', icon: <CalendarCheck size={16}/>, label: 'Xếp Lịch' },
                                    { id: 'budget', icon: <Wallet size={16}/>, label: 'Lương & Quỹ' }
                                ].map(tab => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 sm:flex-none min-w-[110px] px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                                            activeTab === tab.id 
                                                ? 'bg-[#FFD166] text-[#0B1E3F] shadow-md scale-[1.02]' 
                                                : 'text-gray-300 hover:text-white hover:bg-white/20'
                                        }`}
                                    >
                                        {tab.icon} <span className="whitespace-nowrap">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. PHẢI CÙNG: THÔNG TIN USER & MENU DROPDOWN */}
                        <div className="flex items-center gap-3 sm:gap-4 relative" ref={menuRef}>
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">
                                    Xin chào,
                                </p>
                                <p className="text-xs font-extrabold text-[#FFD166] leading-none">
                                    {user?.ho_ten || localStorage.getItem('ho_ten') || 'Người dùng'}
                                </p>
                            </div>
                            <div className="h-8 w-px bg-white/20 hidden sm:block"></div>
                            
                            {/* NÚT HAMBURGER */}
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                                className={`p-2.5 rounded-xl flex items-center gap-2 transition-colors border shadow-sm ${
                                    isMenuOpen ? 'bg-[#FFD166] border-[#FFD166] text-[#0B1E3F]' : 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                                }`}
                            >
                                <Menu size={20} strokeWidth={2.5} />
                            </button>

                            {/* DROPDOWN MENU */}
                            {isMenuOpen && (
                                <div className="absolute top-[120%] right-0 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up origin-top-right z-50">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 sm:hidden">
                                        <p className="text-xs text-gray-500 font-semibold">Tài khoản</p>
                                        <p className="text-sm font-bold text-[#0B1E3F] truncate">{user?.ho_ten || localStorage.getItem('ho_ten')}</p>
                                    </div>
                                    <div className="p-1.5">
                                        <button 
                                            onClick={openProfileModal}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition"
                                        >
                                            <User size={16} /> Thông tin tài khoản
                                        </button>
                                        <button 
                                            onClick={openPasswordModal}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition"
                                        >
                                            <Key size={16} /> Đổi mật khẩu
                                        </button>
                                    </div>
                                    <div className="p-1.5 border-t border-gray-100 bg-gray-50">
                                        <button 
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                if(window.confirm("Bạn muốn đăng xuất?")) logout();
                                            }}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition"
                                        >
                                            <LogOut size={16} strokeWidth={2.5} /> Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </header>

            {/* Thanh chọn Tuần CHỈ hiển thị ở tab schedule */}
            {activeTab === 'schedule' && (
                <div className="max-w-[1920px] mx-auto px-4 mt-6 flex justify-center items-center gap-3 sm:gap-4">
                    <button 
                        onClick={() => setCurrentWeekIdx(Math.max(0, currentWeekIdx - 1))}
                        disabled={currentWeekIdx === 0}
                        className="p-2 sm:p-2.5 bg-white border border-gray-200 rounded-full shadow-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                        <ChevronLeft size={20} className="text-[#0B1E3F]"/>
                    </button>
                    
                    <div className="bg-[#0B1E3F] text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md uppercase tracking-wide min-w-[240px] text-center">
                        Tuần: {weeksList[currentWeekIdx]?.label}
                    </div>
                    
                    <button 
                        onClick={() => setCurrentWeekIdx(Math.min(weeksList.length - 1, currentWeekIdx + 1))}
                        disabled={currentWeekIdx === weeksList.length - 1}
                        className="p-2 sm:p-2.5 bg-white border border-gray-200 rounded-full shadow-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                        <ChevronRight size={20} className="text-[#0B1E3F]"/>
                    </button>
                </div>
            )}

            {/* NỘI DUNG CHÍNH */}
            <main className="max-w-[1920px] mx-auto px-2 sm:px-4 mt-6 space-y-6">
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'schedule' && <ScheduleTab week={weeksList[currentWeekIdx]} />}
                {activeTab === 'budget' && <BudgetTab week={weeksList[currentWeekIdx]} />}
            </main>

            {/* ---------------- MODAL THÔNG TIN TÀI KHOẢN ---------------- */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                        <div className="p-4 bg-[#0B1E3F] text-white flex justify-between items-center">
                            <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                <User size={18} className="text-[#FFD166]"/> Thông tin tài khoản
                            </h3>
                            <button onClick={() => setIsProfileModalOpen(false)} className="hover:bg-white/20 p-1 rounded-md"><X size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleUpdateProfile} className="p-5 space-y-4 bg-gray-50">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mã nhân viên (Chỉ xem)</label>
                                <input type="text" value={profileForm.ma_nhan_vien} disabled className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold bg-gray-100 text-gray-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Họ và tên</label>
                                <input type="text" required value={profileForm.ho_ten} onChange={e => setProfileForm({...profileForm, ho_ten: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Số điện thoại</label>
                                <input type="text" value={profileForm.so_dien_thoai} onChange={e => setProfileForm({...profileForm, so_dien_thoai: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition">Đóng</button>
                                <button type="submit" className="flex-1 py-3 text-sm font-bold text-[#0B1E3F] bg-[#FFD166] hover:bg-yellow-400 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"><Save size={18}/> Cập nhật</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ---------------- MODAL ĐỔI MẬT KHẨU ---------------- */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                        <div className="p-4 bg-amber-600 text-white flex justify-between items-center">
                            <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                <Key size={18} /> Đổi mật khẩu
                            </h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="hover:bg-white/20 p-1 rounded-md"><X size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleChangePassword} className="p-5 space-y-4 bg-gray-50">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Mật khẩu cũ</label>
                                <input type="password" required value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-amber-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Mật khẩu mới</label>
                                <input type="password" required minLength="6" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Xác nhận mật khẩu mới</label>
                                <input type="password" required value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                            
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition">Hủy</button>
                                <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"><CheckCircle2 size={18}/> Xác nhận đổi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}