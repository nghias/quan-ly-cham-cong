import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { AlertCircle, CheckSquare, Square, Clock, Edit2, Check, X, CalendarDays, ShieldCheck, Users, ChevronLeft, ChevronRight } from 'lucide-react';

// Hàm parse chuỗi DATETIME từ MySQL trực tiếp, chống lệch múi giờ
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

export default function BudgetTab() {
    // State quản lý Tháng
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

    const [budgetData, setBudgetData] = useState(null);
    const [lichLam, setLichLam] = useState([]);
    const [nhanVienList, setNhanVienList] = useState([]); 
    const [selectedEmployees, setSelectedEmployees] = useState({});
    
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [editBudgetValue, setEditBudgetValue] = useState('');

    // Logic điều hướng tháng
    const handlePrevMonth = () => {
        setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        const next = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1);
        setCurrentMonthDate(next);
    };

    const handleResetMonth = () => {
        setCurrentMonthDate(new Date());
    };

    // Kiểm tra xem có được phép tiến lên tháng tiếp theo không (Tối đa +1 tháng)
    const maxAllowedMonth = new Date();
    maxAllowedMonth.setMonth(maxAllowedMonth.getMonth() + 1);
    const isNextDisabled = currentMonthDate.getFullYear() > maxAllowedMonth.getFullYear() || 
        (currentMonthDate.getFullYear() === maxAllowedMonth.getFullYear() && currentMonthDate.getMonth() >= maxAllowedMonth.getMonth());

    const y = currentMonthDate.getFullYear();
    const m = currentMonthDate.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    const startStr = `${y}-${String(m).padStart(2, '0')}-01`;
    const endStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    useEffect(() => {
        fetchEmployees();
        fetchShifts(startStr, endStr);
        fetchBudget(startStr, endStr);
        setIsEditingBudget(false);
    }, [currentMonthDate]);

    const fetchEmployees = async () => {
        try {
            const res = await axiosClient.get('/users');
            setNhanVienList(res.data);
            
            // Mặc định tự động chọn tính quỹ cho tất cả, TRỪ Bích Ngọc và Văn Hiền
            const initialSelected = {};
            res.data.forEach(nv => {
                const name = (nv.ho_ten || '').toLowerCase();
                // Sửa lỗi Ngọc Trân: Chỉ đúng Bích Ngọc và Văn Hiền (hoặc ID 1, 2) mới là cố định
                const isFixedStaff = name.includes('bích ngọc') || name.includes('văn hiền') || nv.id === 1 || nv.id === 2;
                initialSelected[nv.id] = !isFixedStaff;
            });
            setSelectedEmployees(initialSelected);
        } catch (err) {
            console.error("Lỗi lấy danh sách nhân sự", err);
        }
    };

    // Lấy toàn bộ ca làm trong tháng
    const fetchShifts = async (start, end) => {
        try {
            const res = await axiosClient.get('/shifts', { 
                params: { startDate: `${start} 00:00:00`, endDate: `${end} 23:59:59` } 
            });
            setLichLam(res.data);
        } catch (err) {
            console.error("Lỗi lấy lịch làm", err);
        }
    };

    const fetchBudget = async (start, end) => {
        try {
            const res = await axiosClient.get('/budget/q8', { params: { ngay_bat_dau: start, ngay_ket_thuc: end } });
            setBudgetData(res.data);
            setEditBudgetValue(res.data?.ngan_sach_toi_da || 10000000); // Mặc định tháng lớn hơn tuần
        } catch (err) {
            console.error("Lỗi lấy ngân sách", err);
        }
    };

    const handleSaveBudget = async () => {
        const val = Number(editBudgetValue);
        if (isNaN(val) || val <= 0) {
            alert("Vui lòng nhập mức ngân sách hợp lệ!");
            return;
        }

        try {
            await axiosClient.post('/budget/q8', {
                ngay_bat_dau: startStr,
                ngay_ket_thuc: endStr,
                ngan_sach_toi_da: val
            });
            setIsEditingBudget(false);
            fetchBudget(startStr, endStr);
        } catch (err) {
            alert("Lỗi khi lưu ngân sách!");
        }
    };

    const toggleEmployee = (id) => {
        setSelectedEmployees(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Khởi tạo danh sách kết quả
    const groupedShifts = {};
    nhanVienList.forEach(nv => {
        groupedShifts[nv.id] = {
            id_nguoi_dung: nv.id,
            ho_ten: nv.ho_ten,
            shifts: [],
            tongTienQ8: 0,
            tongGioQ8: 0,
            tongGioTatCa: 0
        };
    });

    // Lắp dữ liệu ca làm vào
    lichLam.forEach(ca => {
        if (!groupedShifts[ca.id_nguoi_dung]) return;

        groupedShifts[ca.id_nguoi_dung].shifts.push(ca);
        const gioLamCa = Number(ca.so_gio_lam_thuong) + Number(ca.so_gio_tang_ca_dem);
        groupedShifts[ca.id_nguoi_dung].tongGioTatCa += gioLamCa;

        if (ca.id_chi_nhanh === 1) { // Chỉ tính tiền cho ca Q8
            groupedShifts[ca.id_nguoi_dung].tongTienQ8 += gioLamCa * Number(ca.luong_co_ban_luu_tru);
            groupedShifts[ca.id_nguoi_dung].tongGioQ8 += gioLamCa;
        }
    });

    const fixedStaff = [];
    const hourlyStaff = [];

    Object.values(groupedShifts).forEach(emp => {
        const name = (emp.ho_ten || '').toLowerCase();
        // Chỉ Ngọc và Hiền (hoặc Quản lý ID 1, 2) là cố định. Trân được xếp vào Theo Ca.
        if (name.includes('bích ngọc') || name.includes('văn hiền') || emp.id_nguoi_dung === 1 || emp.id_nguoi_dung === 2) {
            fixedStaff.push(emp);
        } else {
            hourlyStaff.push(emp);
        }
    });

    // Tính toán quỹ lương TOÀN THÁNG (chỉ tính Q8)
    const { customTotalSpent, customTotalHours } = Object.values(groupedShifts).reduce((acc, emp) => {
        if (selectedEmployees[emp.id_nguoi_dung]) {
            acc.customTotalSpent += emp.tongTienQ8;
            acc.customTotalHours += emp.tongGioQ8;
        }
        return acc;
    }, { customTotalSpent: 0, customTotalHours: 0 });

    const nganSachToiDa = budgetData ? Number(budgetData.ngan_sach_toi_da) : 10000000;
    const percentage = nganSachToiDa > 0 ? (customTotalSpent / nganSachToiDa) * 100 : 0;
    const progressWidth = Math.min(percentage, 100);

    let barColor = 'bg-emerald-500';
    let statusTextColor = 'text-emerald-600';
    if (percentage > 100) {
        barColor = 'bg-red-500';
        statusTextColor = 'text-red-600';
    } else if (percentage >= 90) {
        barColor = 'bg-amber-400';
        statusTextColor = 'text-amber-600';
    }

    return (
        <div className="space-y-6">
            
            {/* THANH ĐIỀU HƯỚNG THÁNG */}
            <div className="flex justify-center items-center gap-4 mb-2">
                <button 
                    onClick={handlePrevMonth} 
                    className="p-2.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-100 hover:scale-105 transition"
                    title="Tháng trước"
                >
                    <ChevronLeft size={20} className="text-[#0B1E3F]" />
                </button>
                
                <div
                    onClick={handleResetMonth}
                    className="bg-[#0B1E3F] text-white px-8 py-2.5 rounded-2xl font-black text-sm uppercase cursor-pointer hover:bg-[#1D3557] hover:scale-105 transition shadow-lg flex flex-col items-center justify-center leading-tight"
                    title="Nhấp để quay về tháng hiện tại"
                >
                    <span className="text-[10px] text-[#FFD166] tracking-widest opacity-90">Thống Kê Tổng Hợp</span>
                    THÁNG: {String(m).padStart(2, '0')}/{y}
                </div>

                <button 
                    onClick={handleNextMonth} 
                    disabled={isNextDisabled} 
                    className={`p-2.5 bg-white border border-gray-200 rounded-full shadow-sm transition ${isNextDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 hover:scale-105'}`}
                    title="Tháng sau"
                >
                    <ChevronRight size={20} className="text-[#0B1E3F]" />
                </button>
            </div>

            {/* THANH GIÁM SÁT NGÂN SÁCH QUỸ LƯƠNG (THEO THÁNG) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-sm font-extrabold text-[#0B1E3F] flex items-center gap-2 uppercase">
                        <AlertCircle size={18} className="text-[#FFD166]"/> Giám Sát Quỹ Lương Quận 8 Tháng {m}
                    </h2>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">Ngân sách tháng này:</span>
                        {isEditingBudget ? (
                            <div className="flex items-center gap-1.5 bg-gray-50 border rounded-lg px-2 py-1">
                                <input
                                    type="number"
                                    step="500000"
                                    value={editBudgetValue}
                                    onChange={(e) => setEditBudgetValue(e.target.value)}
                                    className="w-28 text-xs font-bold text-[#0B1E3F] bg-transparent outline-none"
                                    autoFocus
                                />
                                <span className="text-xs text-gray-500">đ</span>
                                <button onClick={handleSaveBudget} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded transition"><Check size={14}/></button>
                                <button onClick={() => { setIsEditingBudget(false); setEditBudgetValue(nganSachToiDa); }} className="p-1 text-gray-400 hover:bg-gray-200 rounded transition"><X size={14}/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-[#0B1E3F] bg-gray-100 px-2.5 py-1 rounded-md">
                                    {nganSachToiDa.toLocaleString()}đ
                                </span>
                                <button onClick={() => setIsEditingBudget(true)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"><Edit2 size={14}/></button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between text-sm font-bold gap-1">
                        <span className="text-[#0B1E3F] flex items-center gap-1.5">
                            <CalendarDays size={16} className="text-blue-500" />
                            Đã chi trong tháng {m} (Q8): {customTotalSpent.toLocaleString()}đ 
                            <span className="text-gray-500 font-normal ml-2">({customTotalHours} giờ làm)</span>
                        </span>
                        <span className={`text-xs sm:text-sm font-bold ${statusTextColor}`}>
                            {percentage.toFixed(1)}% ({percentage > 100 ? 'Vượt ngân sách' : percentage >= 90 ? 'Cảnh báo mức cao' : 'Trong tầm an toàn'})
                        </span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden border border-gray-200">
                        <div className={`h-4 transition-all duration-500 ${barColor}`} style={{ width: `${progressWidth}%` }}></div>
                    </div>

                    {percentage > 100 && (
                        <p className="text-xs text-red-600 font-bold animate-pulse">
                            CẢNH BÁO: Tổng quỹ lương tháng đã vượt quá mức cho phép ({percentage.toFixed(1)}%)!
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-8">
                
                {/* KHU VỰC NHÂN SỰ CỐ ĐỊNH */}
                {fixedStaff.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
                            <ShieldCheck size={20} className="text-slate-500" />
                            <h2 className="text-sm font-extrabold text-slate-700 uppercase">
                                Nhóm Nhân Sự Quản Lý & Cố Định <span className="text-xs font-normal italic text-slate-500 ml-2">(Chỉ đối soát giờ làm, không tính lương theo ca)</span>
                            </h2>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {fixedStaff.map((emp) => (
                                <div key={emp.id_nguoi_dung} className="bg-slate-50 border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm transition">
                                    <div className="bg-slate-600 text-white p-3 flex justify-between items-center">
                                        <span className="text-sm font-extrabold truncate max-w-[180px] uppercase tracking-wide" title={emp.ho_ten}>{emp.ho_ten}</span>
                                        <span className="text-[10px] bg-slate-500 px-2 py-0.5 rounded font-semibold">Cố Định</span>
                                    </div>
                                    <div className="flex-1 p-2 space-y-2 max-h-[250px] overflow-y-auto text-xs">
                                        {emp.shifts.length > 0 ? (
                                            emp.shifts.map((s, i) => {
                                                const startParsed = parseMySqlDateTime(s.thoi_gian_bat_dau);
                                                const endParsed = parseMySqlDateTime(s.thoi_gian_ket_thuc);
                                                const shiftHours = Number(s.so_gio_lam_thuong) + Number(s.so_gio_tang_ca_dem);
                                                const isQ8 = s.id_chi_nhanh === 1;
                                                return (
                                                    <div key={i} className="flex items-center justify-between border-b border-slate-200 pb-1.5 pt-1.5 text-slate-700">
                                                        <span className="font-bold w-12">{startParsed.day}/{startParsed.month}</span>
                                                        <span className="flex-1 text-center font-medium">{startParsed.hour}h - {endParsed.hour}h</span>
                                                        <div className="flex items-center gap-1.5 justify-end w-16">
                                                            <span className="font-bold">{shiftHours}h</span>
                                                            <span className={`px-1 rounded text-[9px] font-bold ${isQ8 ? 'bg-[#FFD166]/80 text-[#0B1E3F]' : 'bg-slate-300 text-slate-600'}`}>{isQ8 ? 'Q8' : 'F1'}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : <div className="flex items-center justify-center h-full min-h-[60px] text-slate-400 italic font-medium">Không có ca làm.</div>}
                                    </div>
                                    <div className="bg-slate-200/50 p-3 text-xs font-bold border-t border-slate-200 flex justify-between items-center text-slate-700">
                                        <span className="flex items-center gap-1"><Clock size={14}/> Tổng giờ đã làm tháng này:</span>
                                        <span className="text-sm font-black text-slate-800">{emp.tongGioTatCa} giờ</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* KHU VỰC NHÂN SỰ TÍNH LƯƠNG THEO CA */}
                {hourlyStaff.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2 mt-4">
                            <Users size={20} className="text-[#0B1E3F]" />
                            <h2 className="text-sm font-extrabold text-[#0B1E3F] uppercase">
                                Nhóm Nhân Sự Tính Lương Theo Ca <span className="text-xs font-normal italic text-gray-500 ml-2">(Tích chọn ô "Tính quỹ" để đưa vào báo cáo Q8)</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {hourlyStaff.map((emp) => {
                                const isChecked = !!selectedEmployees[emp.id_nguoi_dung];
                                return (
                                    <div key={emp.id_nguoi_dung} className={`bg-white border rounded-xl flex flex-col overflow-hidden shadow-sm transition ${isChecked ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 opacity-75'}`}>
                                        <div className="bg-[#0B1E3F] text-white p-3 flex justify-between items-center">
                                            <span className="text-sm font-extrabold truncate max-w-[140px] uppercase tracking-wide" title={emp.ho_ten}>{emp.ho_ten}</span>
                                            <button type="button" onClick={() => toggleEmployee(emp.id_nguoi_dung)} className="text-[#FFD166] hover:scale-105 transition flex items-center gap-1.5 text-xs font-semibold border border-white/20 bg-white/10 px-2.5 py-1 rounded cursor-pointer">
                                                {isChecked ? <CheckSquare size={14}/> : <Square size={14}/>}
                                                {isChecked ? 'Tính quỹ' : 'Bỏ qua'}
                                            </button>
                                        </div>
                                        
                                        <div className="flex-1 p-2 space-y-2 max-h-[250px] overflow-y-auto bg-gray-50 text-xs">
                                            {emp.shifts.length > 0 ? (
                                                emp.shifts.map((s, i) => {
                                                    const startParsed = parseMySqlDateTime(s.thoi_gian_bat_dau);
                                                    const endParsed = parseMySqlDateTime(s.thoi_gian_ket_thuc);
                                                    const isQ8 = s.id_chi_nhanh === 1;
                                                    const shiftHours = Number(s.so_gio_lam_thuong) + Number(s.so_gio_tang_ca_dem);
                                                    const tienCaLam = Number(s.luong_thuc_lanh);
                                                    
                                                    return (
                                                        <div key={i} className="flex items-center justify-between border-b pb-1.5 pt-1.5 text-[#0B1E3F]">
                                                            <span className="font-bold w-8">{startParsed.day}/{startParsed.month}</span>
                                                            <span className="w-16 text-center">{startParsed.hour}h - {endParsed.hour}h</span>
                                                            <div className="flex items-center gap-1 w-14 justify-center">
                                                                <span className="text-[10px] text-gray-500">({shiftHours}h)</span>
                                                                <span className={`font-bold px-1 rounded text-[10px] ${isQ8 ? 'bg-[#FFD166]/60 text-[#0B1E3F]' : 'bg-gray-200 text-gray-500'}`}>
                                                                    {isQ8 ? 'Q8' : 'F1'}
                                                                </span>
                                                            </div>
                                                            <span className={`font-bold text-right w-16 ${isQ8 ? 'text-blue-700' : 'text-gray-400'}`}>
                                                                {tienCaLam.toLocaleString()}đ
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            ) : <div className="flex items-center justify-center h-full min-h-[60px] text-gray-400 italic font-medium">Không có ca làm trong tháng.</div>}
                                        </div>

                                        <div className="bg-yellow-50/80 p-3 text-xs font-bold space-y-1.5 border-t border-yellow-200">
                                            <div className="flex justify-between text-gray-700 text-[11px] items-center">
                                                <span className="flex items-center gap-1 font-semibold"><Clock size={12}/> Tổng giờ làm tháng:</span>
                                                <span className="text-blue-700 font-extrabold text-xs">{emp.tongGioTatCa}h</span>
                                            </div>
                                            <div className="flex justify-between text-[#0B1E3F] text-sm pt-2 border-t border-yellow-300 items-center mt-1">
                                                <span className="font-extrabold">Thực lãnh tháng (Q8):</span>
                                                {/* Chỉ cộng tiền của ca Q8 vào thực lãnh */}
                                                <span className="font-black text-emerald-700">
                                                    {emp.shifts.filter(s => s.id_chi_nhanh === 1).reduce((t, x) => t + Number(x.luong_thuc_lanh), 0).toLocaleString()}đ
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}