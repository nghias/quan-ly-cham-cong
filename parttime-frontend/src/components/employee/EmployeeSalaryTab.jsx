import React, { useState, useEffect, useContext } from 'react';
import axiosClient from '../../api/axiosClient';
import { AuthContext } from '../../context/AuthContext';
import { Clock, Banknote, CalendarDays, Receipt, Calendar } from 'lucide-react';

// Hàm parse chuỗi DATETIME từ MySQL trực tiếp, chống lệch múi giờ UTC
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

export default function EmployeeSalaryTab({ week }) {
    const { user } = useContext(AuthContext);
    const [myShifts, setMyShifts] = useState([]);
    const [stats, setStats] = useState({ tongGio: 0, tongTien: 0 });
    const [monthlyStats, setMonthlyStats] = useState({ tongGioThang: 0, tongTienThang: 0 });

    useEffect(() => {
        fetchData();
    }, [week, user]);

    const fetchData = async () => {
        try {
            const currentUserId = user?.id || localStorage.getItem('id') || localStorage.getItem('userId');
            const currentUserName = (user?.ho_ten || localStorage.getItem('ho_ten') || '').trim().toLowerCase();

            const filterMyShifts = (shiftsList) => {
                return shiftsList.filter(ca => {
                    const matchId = currentUserId && String(ca.id_nguoi_dung) === String(currentUserId);
                    const matchName = currentUserName && ca.ho_ten && ca.ho_ten.trim().toLowerCase() === currentUserName;
                    return matchId || matchName;
                });
            };

            // 1. Lấy dữ liệu CHÍNH XÁC cho TUẦN đang chọn dựa trên tham số truyền vào
            const resWeek = await axiosClient.get('/shifts', {
                params: { startDate: `${week.start} 00:00:00`, endDate: `${week.end} 23:59:59` }
            });

            const personalShifts = filterMyShifts(resWeek.data);
            personalShifts.sort((a, b) => {
                const pA = parseMySqlDateTime(a.thoi_gian_bat_dau);
                const pB = parseMySqlDateTime(b.thoi_gian_bat_dau);
                return new Date(pA.year, pA.month - 1, pA.day, pA.hour, pA.minute) - new Date(pB.year, pB.month - 1, pB.day, pB.hour, pB.minute);
            });
            setMyShifts(personalShifts);

            let tongG = 0;
            let tongT = 0;
            personalShifts.forEach(ca => {
                tongG += (Number(ca.so_gio_lam_thuong || 0) + Number(ca.so_gio_tang_ca_dem || 0));
                tongT += Number(ca.luong_thuc_lanh || 0);
            });
            setStats({ tongGio: tongG, tongTien: tongT });

            // 2. Lấy dữ liệu cho cả THÁNG (để tính tổng tháng) bằng cách tách chuỗi an toàn chống lệch múi giờ
            const [y, m] = week.start ? week.start.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
            const lastDay = new Date(y, m, 0).getDate();
            const monthStart = `${y}-${String(m).padStart(2, '0')}-01`;
            const monthEnd = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;

            const resMonth = await axiosClient.get('/shifts', {
                params: { startDate: `${monthStart} 00:00:00`, endDate: `${monthEnd} 23:59:59` }
            });

            const monthShifts = filterMyShifts(resMonth.data);
            let gThang = 0;
            let tThang = 0;
            monthShifts.forEach(ca => {
                gThang += (Number(ca.so_gio_lam_thuong || 0) + Number(ca.so_gio_tang_ca_dem || 0));
                tThang += Number(ca.luong_thuc_lanh || 0);
            });
            setMonthlyStats({ tongGioThang: gThang, tongTienThang: tThang });

        } catch (error) {
            console.error("Lỗi tải dữ liệu lương", error);
        }
    };

    const currentMonthNumber = week.start ? Number(week.start.split('-')[1]) : new Date().getMonth() + 1;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* THẺ THỐNG KÊ THEO THÁNG */}
            <div className="bg-gradient-to-r from-slate-900 via-[#0B1E3F] to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-[#FFD166] text-[#0B1E3F] p-3.5 rounded-xl shadow-md">
                        <Calendar size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tổng kết tháng {currentMonthNumber}</p>
                        <h3 className="text-xl font-extrabold text-white mt-0.5">Thu nhập tích lũy trong tháng</h3>
                    </div>
                </div>
                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
                    <span className="text-2xl sm:text-3xl font-black text-[#FFD166]">
                        {monthlyStats.tongTienThang.toLocaleString()} <span className="text-sm font-bold">VNĐ</span>
                    </span>
                    <span className="text-xs font-semibold text-gray-300">
                        ({monthlyStats.tongGioThang} giờ làm việc)
                    </span>
                </div>
            </div>

            {/* THẺ TỔNG QUAN TUẦN NÀY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-[#0B1E3F] to-[#1D3557] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                            <Clock size={16} className="text-[#FFD166]"/> Tổng Giờ Làm Tuần Này
                        </p>
                        <h2 className="text-4xl font-black">{stats.tongGio} <span className="text-lg text-gray-400 font-medium">Giờ</span></h2>
                    </div>
                    <Clock size={100} className="absolute -right-6 -bottom-6 text-white opacity-5" />
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-sm font-semibold text-emerald-100 uppercase tracking-wider flex items-center gap-2 mb-2">
                            <Banknote size={16} className="text-emerald-200"/> Thực Lãnh Tuần Này
                        </p>
                        <h2 className="text-4xl font-black">{stats.tongTien.toLocaleString()} <span className="text-lg text-emerald-200 font-medium">VNĐ</span></h2>
                    </div>
                    <Banknote size={100} className="absolute -right-6 -bottom-6 text-white opacity-10" />
                </div>
            </div>

            {/* DANH SÁCH CHI TIẾT CA LÀM TRONG TUẦN */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
                    <Receipt size={18} className="text-[#0B1E3F]" />
                    <h2 className="text-sm font-extrabold text-[#0B1E3F] uppercase tracking-wide">Chi Tiết Từng Ca Thực Tế Trong Tuần</h2>
                </div>

                <div className="p-4 space-y-3">
                    {myShifts.length > 0 ? (
                        myShifts.map((ca, index) => {
                            const startParsed = parseMySqlDateTime(ca.thoi_gian_bat_dau);
                            const endParsed = parseMySqlDateTime(ca.thoi_gian_ket_thuc);
                            
                            const localDateObj = new Date(startParsed.year, startParsed.month - 1, startParsed.day);
                            const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                            const dayOfWeekStr = dayNames[localDateObj.getDay()];

                            const hStart = startParsed.hour;
                            const hEnd = endParsed.hour;
                            const shiftHours = Number(ca.so_gio_lam_thuong || 0) + Number(ca.so_gio_tang_ca_dem || 0);
                            const isQ8 = ca.id_chi_nhanh === 1;

                            return (
                                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow gap-3 sm:gap-0">
                                    {/* Ngày Tháng */}
                                    <div className="flex items-center gap-4 w-full sm:w-1/3">
                                        <div className="bg-blue-50 text-blue-700 w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0">
                                            <span className="text-[10px] font-bold uppercase">{dayOfWeekStr}</span>
                                            <span className="text-lg font-black leading-none">{startParsed.day}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-extrabold text-gray-800">{hStart}h:00 - {hEnd}h:00</p>
                                            <p className="text-xs font-semibold text-gray-500 mt-0.5 flex items-center gap-1">
                                                <CalendarDays size={12}/> Tháng {startParsed.month}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Số giờ & Chi nhánh */}
                                    <div className="flex items-center sm:justify-center gap-2 w-full sm:w-1/3 border-t sm:border-t-0 border-gray-100 pt-2 sm:pt-0">
                                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-bold">
                                            {shiftHours} giờ
                                        </span>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${isQ8 ? 'bg-[#FFD166]/30 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                                            CN: {isQ8 ? 'Quận 8' : 'Chi nhánh khác'}
                                        </span>
                                    </div>

                                    {/* Tiền lương */}
                                    <div className="text-left sm:text-right w-full sm:w-1/3">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Tiền công ca</p>
                                        <p className="text-base font-black text-emerald-600">
                                            + {Number(ca.luong_thuc_lanh || 0).toLocaleString()}đ
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                            <Receipt size={48} className="opacity-20 mb-3" />
                            <p className="font-semibold text-center">Quản lý chưa xếp lịch làm việc thực tế cho bạn trong tuần này.</p>
                            <p className="text-xs mt-1 text-center">Hãy quay lại trang Lịch làm việc để kiểm tra bảng số 2.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}