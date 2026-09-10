import React, { useState, useEffect, useContext } from 'react';
import axiosClient from '../../api/axiosClient';
import { AuthContext } from '../../context/AuthContext';
import { Clock, Banknote, Receipt, Calendar, ChevronLeft, ChevronRight, Gift, Wallet } from 'lucide-react';

// BÓC TÁCH MÚI GIỜ TRỰC TIẾP TỪ CHUỖI MYSQL (BỎ QUA NEW DATE ĐỂ KHÔNG BAO GIỜ BỊ LỆCH 7 TIẾNG)
function parseMySqlDateTime(dateTimeStr) {
    if (!dateTimeStr) return { year: 0, month: 0, day: 0, hour: 0, minute: 0, dateKey: '' };
    const cleaned = String(dateTimeStr).replace('T', ' ').replace('Z', '').split('.')[0];
    const [datePart, timePart] = cleaned.split(' ');
    
    let year = 0, month = 0, day = 0;
    if (datePart) {
        const parts = datePart.split('-');
        if (parts.length === 3) {
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
            day = parseInt(parts[2], 10);
        }
    }

    let hour = 0, minute = 0;
    if (timePart) {
        const timeParts = timePart.split(':');
        if (timeParts.length >= 2) {
            hour = parseInt(timeParts[0], 10);
            minute = parseInt(timeParts[1], 10);
        }
    }

    const dateKey = (year && month && day) 
        ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` 
        : '';

    return { year, month, day, hour, minute, dateKey };
}

export default function EmployeeSalaryTab() {
    const { user } = useContext(AuthContext);
    const [myShifts, setMyShifts] = useState([]);
    
    // State quản lý thanh điều hướng Tháng
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

    const [monthlyStats, setMonthlyStats] = useState({
        tongGio: 0,
        luongCoBan: 0,
        tienThuong: 0,
        tongPhuCap: 0,
        tongKhauTru: 0,
        tongThucLanh: 0
    });

    const handlePrevMonth = () => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    const handleResetMonth = () => setCurrentMonthDate(new Date());

    const maxAllowedMonth = new Date(); maxAllowedMonth.setMonth(maxAllowedMonth.getMonth() + 1);
    const isNextDisabled = currentMonthDate.getFullYear() > maxAllowedMonth.getFullYear() || 
                           (currentMonthDate.getFullYear() === maxAllowedMonth.getFullYear() && currentMonthDate.getMonth() >= maxAllowedMonth.getMonth());

    useEffect(() => {
        fetchMonthlyData();
    }, [currentMonthDate, user]);

    const fetchMonthlyData = async () => {
        try {
            const currentUserId = user?.id || localStorage.getItem('id') || localStorage.getItem('userId');
            const currentUserName = (user?.ho_ten || localStorage.getItem('ho_ten') || '').trim().toLowerCase();

            const y = currentMonthDate.getFullYear();
            const m = currentMonthDate.getMonth() + 1;
            const lastDay = new Date(y, m, 0).getDate();
            const monthStart = `${y}-${String(m).padStart(2, '0')}-01 00:00:00`;
            const monthEnd = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59`;

            const resMonth = await axiosClient.get('/shifts', {
                params: { startDate: monthStart, endDate: monthEnd }
            });

            const personalShifts = resMonth.data.filter(ca => {
                const matchId = currentUserId && String(ca.id_nguoi_dung) === String(currentUserId);
                const matchName = currentUserName && ca.ho_ten && ca.ho_ten.trim().toLowerCase() === currentUserName;
                return matchId || matchName;
            });

            personalShifts.sort((a, b) => {
                const pA = parseMySqlDateTime(a.thoi_gian_bat_dau);
                const pB = parseMySqlDateTime(b.thoi_gian_bat_dau);
                return new Date(pA.year, pA.month - 1, pA.day, pA.hour, pA.minute) - new Date(pB.year, pB.month - 1, pB.day, pB.hour, pB.minute);
            });

            let tGio = 0;
            let tCoBan = 0;
            let tThuong = 0;
            let tPhuCap = 0;
            let tKhauTru = 0;
            let tThucLanh = 0;

            const enrichedShifts = personalShifts.map(ca => {
                const startParsed = parseMySqlDateTime(ca.thoi_gian_bat_dau);
                const endParsed = parseMySqlDateTime(ca.thoi_gian_ket_thuc);
                
                const shiftHours = Number(ca.so_gio_lam_thuong || 0) + Number(ca.so_gio_tang_ca_dem || 0);
                const heSo = Number(ca.he_so_ngay_le) || 1;
                const baseWage = Math.round(Number(ca.luong_co_ban_luu_tru) || 0);

                const phuCapCoDinh = Math.round(Number(ca.phu_cap_co_dinh_luu_tru) || 0);
                const phuCapGio = Math.round(Number(ca.phu_cap_gio_luu_tru) || 0);
                const khauTruGio = Math.round(Number(ca.khau_tru_gio_luu_tru) || 0);

                const tienCoBan = shiftHours * baseWage;
                const tienThuong = shiftHours * baseWage * (heSo - 1);
                const tongPhuCap = phuCapCoDinh + (phuCapGio * shiftHours);
                const tongKhauTru = khauTruGio * shiftHours;

                const thucLanhMoi = tienCoBan + tienThuong + tongPhuCap - tongKhauTru;

                tGio += shiftHours;
                tCoBan += tienCoBan;
                tThuong += tienThuong;
                tPhuCap += tongPhuCap;
                tKhauTru += tongKhauTru;
                tThucLanh += thucLanhMoi;

                const tenCN = ca.ten_chi_nhanh || (Number(ca.id_chi_nhanh) === 1 ? 'Quận 8' : `Chi nhánh ${ca.id_chi_nhanh}`);

                return {
                    ...ca,
                    startParsed,
                    endParsed,
                    shiftHours,
                    baseWage,
                    heSo,
                    tienCoBan,
                    tienThuong,
                    tongPhuCap,
                    tongKhauTru,
                    thucLanhMoi,
                    tenCN
                };
            });

            setMyShifts(enrichedShifts);
            setMonthlyStats({
                tongGio: tGio,
                luongCoBan: tCoBan,
                tienThuong: tThuong,
                tongPhuCap: tPhuCap,
                tongKhauTru: tKhauTru,
                tongThucLanh: tThucLanh
            });

        } catch (error) {
            console.error("Lỗi tải dữ liệu lương", error);
        }
    };

    const y = currentMonthDate.getFullYear();
    const m = currentMonthDate.getMonth() + 1;

    return (
        <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-0">
            
            <div className="flex justify-center items-center gap-4 mb-2 mt-4">
                <button onClick={handlePrevMonth} className="p-2.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-100 hover:scale-105 transition" title="Tháng trước">
                    <ChevronLeft size={20} className="text-[#0B1E3F]" />
                </button>
                
                <div onClick={handleResetMonth} className="bg-[#0B1E3F] text-white px-8 py-2.5 rounded-2xl font-black text-sm uppercase cursor-pointer hover:bg-[#1D3557] hover:scale-105 transition shadow-lg flex flex-col items-center justify-center leading-tight" title="Nhấp để quay về tháng hiện tại">
                    <span className="text-[10px] text-[#FFD166] tracking-widest opacity-90">Bảng lương cá nhân</span>
                    THÁNG: {String(m).padStart(2, '0')}/{y}
                </div>

                <button onClick={handleNextMonth} disabled={isNextDisabled} className={`p-2.5 bg-white border border-gray-200 rounded-full shadow-sm transition ${isNextDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 hover:scale-105'}`} title="Tháng sau">
                    <ChevronRight size={20} className="text-[#0B1E3F]" />
                </button>
            </div>

            <div className="bg-gradient-to-r from-slate-900 via-[#0B1E3F] to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="bg-[#FFD166] text-[#0B1E3F] p-4 rounded-xl shadow-md shrink-0">
                        <Banknote size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tổng thực lãnh tháng {m}</p>
                        <h3 className="text-3xl sm:text-4xl font-black text-white mt-1">
                            {monthlyStats.tongThucLanh.toLocaleString('vi-VN')} <span className="text-lg font-bold text-[#FFD166]">VNĐ</span>
                        </h3>
                    </div>
                </div>

                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-6">
                    <div className="bg-white/10 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-300 uppercase font-semibold flex items-center gap-1.5 mb-1"><Clock size={12}/> Tổng giờ làm</p>
                        <p className="text-xl font-bold">{monthlyStats.tongGio}h</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-300 uppercase font-semibold flex items-center gap-1.5 mb-1"><Wallet size={12}/> Lương cơ bản</p>
                        <p className="text-xl font-bold">{monthlyStats.luongCoBan.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="bg-pink-900/40 p-3 rounded-xl border border-pink-500/30 flex flex-col gap-1">
                        <p className="text-[10px] text-pink-200 uppercase font-semibold flex items-center gap-1.5"><Gift size={12}/> Thưởng & Phụ Cấp</p>
                        <p className="text-xl font-bold text-pink-400">+{ (monthlyStats.tienThuong + monthlyStats.tongPhuCap).toLocaleString('vi-VN') }đ</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
                    <Receipt size={18} className="text-[#0B1E3F]" />
                    <h2 className="text-sm font-extrabold text-[#0B1E3F] uppercase tracking-wide">Chi Tiết Bóc Tách Các Ca Làm</h2>
                </div>

                <div className="p-0 sm:p-4">
                    {myShifts.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {myShifts.map((ca, index) => {
                                const localDateObj = new Date(ca.startParsed.year, ca.startParsed.month - 1, ca.startParsed.day);
                                const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                                const dayOfWeekStr = dayNames[localDateObj.getDay()];

                                return (
                                    <div key={index} className="flex flex-col md:flex-row md:items-center justify-between p-4 sm:rounded-xl hover:bg-slate-50 transition-colors gap-4">
                                        
                                        <div className="flex items-center gap-4 md:w-1/3">
                                            <div className="bg-blue-50 text-blue-700 w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                                                <span className="text-[9px] font-bold uppercase tracking-wider">{dayOfWeekStr}</span>
                                                <span className="text-xl font-black leading-none mt-0.5">{ca.startParsed.day}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-extrabold text-[#0B1E3F]">
                                                    {ca.startParsed.hour}h:{String(ca.startParsed.minute).padStart(2, '0')} - {ca.endParsed.hour}h:{String(ca.endParsed.minute).padStart(2, '0')}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                        {ca.shiftHours} giờ
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${Number(ca.id_chi_nhanh) === 1 ? 'bg-[#FFD166]/30 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                                                        CN: {ca.tenCN}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:w-1/3 flex flex-col gap-1.5 pl-14 md:pl-0">
                                            <div className="flex justify-between text-xs items-center">
                                                <span className="text-gray-500 font-medium">Lương cơ bản ({ca.baseWage.toLocaleString('vi-VN')}đ/h)</span>
                                                <span className="font-bold text-gray-700">{ca.tienCoBan.toLocaleString('vi-VN')}đ</span>
                                            </div>
                                            {ca.heSo > 1 ? (
                                                <div className="flex justify-between text-xs items-center">
                                                    <span className="text-pink-600 font-bold bg-pink-50 px-1.5 py-0.5 rounded">Thưởng Lễ / Tăng ca (x{ca.heSo})</span>
                                                    <span className="font-bold text-pink-600">+{ca.tienThuong.toLocaleString('vi-VN')}đ</span>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between text-xs items-center opacity-40">
                                                    <span className="text-gray-400 font-medium">Thưởng / Tăng ca (x1)</span>
                                                    <span className="font-bold text-gray-400">0đ</span>
                                                </div>
                                            )}
                                            {ca.tongPhuCap > 0 && (
                                                <div className="flex justify-between text-xs items-center">
                                                    <span className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">Phụ cấp</span>
                                                    <span className="font-bold text-blue-600">+{ca.tongPhuCap.toLocaleString('vi-VN')}đ</span>
                                                </div>
                                            )}
                                            {ca.tongKhauTru > 0 && (
                                                <div className="flex justify-between text-xs items-center">
                                                    <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">Khấu trừ</span>
                                                    <span className="font-bold text-red-600">-{ca.tongKhauTru.toLocaleString('vi-VN')}đ</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:w-1/4 text-right border-t md:border-t-0 border-dashed border-gray-200 pt-3 md:pt-0 mt-1 md:mt-0 flex justify-between md:flex-col items-center md:items-end">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5 hidden md:block">Tổng cộng ca</p>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase md:hidden">Thực lãnh:</span>
                                            <p className="text-lg font-black text-emerald-600">
                                                {ca.thucLanhMoi.toLocaleString('vi-VN')}đ
                                            </p>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                            <Receipt size={48} className="opacity-20 mb-3" />
                            <p className="font-semibold text-center text-base">Không có dữ liệu ca làm trong tháng này.</p>
                            <p className="text-xs mt-1 text-center">Nếu bạn vừa đăng ký, vui lòng đợi Quản lý xếp lịch và duyệt lương.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}