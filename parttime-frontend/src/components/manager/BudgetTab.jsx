import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { AlertCircle, CheckSquare, Square, Clock, Edit2, Check, X, CalendarDays } from 'lucide-react';

export default function BudgetTab({ week }) {
    const [budgetData, setBudgetData] = useState(null);
    const [lichLam, setLichLam] = useState([]);
    const [nhanVienList, setNhanVienList] = useState([]); 
    const [selectedEmployees, setSelectedEmployees] = useState({});
    
    // State lưu tổng lương của cả tháng
    const [tongLuongThang, setTongLuongThang] = useState({ all: 0, q8: 0 });

    // State chỉnh sửa ngân sách
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [editBudgetValue, setEditBudgetValue] = useState('');

    useEffect(() => {
        fetchEmployees();
        fetchShifts(week.start, week.end);
        fetchBudget(week.start, week.end);
        fetchMonthlyShifts(week.start); // Lấy dữ liệu của cả tháng
        setIsEditingBudget(false);
    }, [week]);

    // Gọi API lấy TẤT CẢ nhân viên
    const fetchEmployees = async () => {
        try {
            const res = await axiosClient.get('/users');
            setNhanVienList(res.data);
            
            // Mặc định tự động chọn tính quỹ cho tất cả, TRỪ Quản lý (ID 1) và Kỹ thuật (ID 2)
            const initialSelected = {};
            res.data.forEach(nv => {
                if (nv.id !== 1 && nv.id !== 2) {
                    initialSelected[nv.id] = true;
                } else {
                    initialSelected[nv.id] = false;
                }
            });
            setSelectedEmployees(initialSelected);
        } catch (err) {
            console.error("Lỗi lấy danh sách nhân sự", err);
        }
    };

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

    // Hàm mới: Tính tổng quỹ lương của nguyên THÁNG hiện tại
    const fetchMonthlyShifts = async (dateStr) => {
        try {
            const date = new Date(dateStr);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const lastDay = new Date(y, date.getMonth() + 1, 0).getDate();

            const start = `${y}-${m}-01`;
            const end = `${y}-${m}-${lastDay}`;

            const res = await axiosClient.get('/shifts', { 
                params: { startDate: `${start} 00:00:00`, endDate: `${end} 23:59:59` } 
            });

            // Cộng dồn thực lãnh của cả tháng
            const totalQ8 = res.data.reduce((sum, ca) => ca.id_chi_nhanh === 1 ? sum + Number(ca.luong_thuc_lanh) : sum, 0);
            const totalAll = res.data.reduce((sum, ca) => sum + Number(ca.luong_thuc_lanh), 0);

            setTongLuongThang({ all: totalAll, q8: totalQ8 });
        } catch (err) {
            console.error("Lỗi lấy tổng lương tháng", err);
        }
    };

    const fetchBudget = async (start, end) => {
        try {
            const res = await axiosClient.get('/budget/q8', { params: { ngay_bat_dau: start, ngay_ket_thuc: end } });
            setBudgetData(res.data);
            setEditBudgetValue(res.data?.ngan_sach_toi_da || 2500000);
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
                ngay_bat_dau: week.start,
                ngay_ket_thuc: week.end,
                ngan_sach_toi_da: val
            });
            setIsEditingBudget(false);
            fetchBudget(week.start, week.end);
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

    // Khởi tạo danh sách kết quả chứa TẤT CẢ nhân viên
    const groupedShifts = {};
    nhanVienList.forEach(nv => {
        groupedShifts[nv.id] = {
            id_nguoi_dung: nv.id,
            ho_ten: nv.ho_ten,
            shifts: [],
            tongTienQ8: 0,
            tongTienQ8Goc: 0,
            tongGioQ8: 0,
            tongGioTatCa: 0
        };
    });

    // Lắp dữ liệu ca làm vào từng nhân viên tương ứng
    lichLam.forEach(ca => {
        if (!groupedShifts[ca.id_nguoi_dung]) return;

        groupedShifts[ca.id_nguoi_dung].shifts.push(ca);
        
        const gioLamCa = Number(ca.so_gio_lam_thuong) + Number(ca.so_gio_tang_ca_dem);
        groupedShifts[ca.id_nguoi_dung].tongGioTatCa += gioLamCa;

        if (ca.id_chi_nhanh === 1) {
            groupedShifts[ca.id_nguoi_dung].tongTienQ8 += Number(ca.luong_thuc_lanh);
            groupedShifts[ca.id_nguoi_dung].tongTienQ8Goc += gioLamCa * Number(ca.luong_co_ban_luu_tru);
            groupedShifts[ca.id_nguoi_dung].tongGioQ8 += gioLamCa;
        }
    });

    const { customTotalSpent, customTotalHours } = Object.values(groupedShifts).reduce((acc, emp) => {
        if (selectedEmployees[emp.id_nguoi_dung]) {
            acc.customTotalSpent += emp.tongTienQ8Goc;
            acc.customTotalHours += emp.tongGioQ8;
        }
        return acc;
    }, { customTotalSpent: 0, customTotalHours: 0 });

    const nganSachToiDa = budgetData ? Number(budgetData.ngan_sach_toi_da) : 2500000;
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

    const currentMonth = new Date(week.start).getMonth() + 1;

    return (
        <div className="space-y-6">
            {/* Thanh Giám Sát Ngân Sách */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-sm font-extrabold text-[#0B1E3F] flex items-center gap-2 uppercase">
                        <AlertCircle size={18} className="text-[#FFD166]"/> Giám Sát Quỹ Lương Quận 8 (10% Doanh Thu)
                    </h2>
                    
                    {/* Phần Chỉnh sửa Ngân Sách */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">Ngân sách tuần này:</span>
                        {isEditingBudget ? (
                            <div className="flex items-center gap-1.5 bg-gray-50 border rounded-lg px-2 py-1">
                                <input
                                    type="number"
                                    step="50000"
                                    value={editBudgetValue}
                                    onChange={(e) => setEditBudgetValue(e.target.value)}
                                    className="w-28 text-xs font-bold text-[#0B1E3F] bg-transparent outline-none"
                                    autoFocus
                                />
                                <span className="text-xs text-gray-500">đ</span>
                                <button 
                                    onClick={handleSaveBudget} 
                                    className="p-1 text-emerald-600 hover:bg-emerald-100 rounded transition"
                                    title="Lưu"
                                >
                                    <Check size={14}/>
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsEditingBudget(false);
                                        setEditBudgetValue(nganSachToiDa);
                                    }} 
                                    className="p-1 text-gray-400 hover:bg-gray-200 rounded transition"
                                    title="Hủy"
                                >
                                    <X size={14}/>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-[#0B1E3F] bg-gray-100 px-2.5 py-1 rounded-md">
                                    {nganSachToiDa.toLocaleString()}đ
                                </span>
                                <button 
                                    onClick={() => setIsEditingBudget(true)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                                    title="Chỉnh sửa hạn mức ngân sách"
                                >
                                    <Edit2 size={14}/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Dòng Tổng Lương Tháng */}
                    <div className="flex flex-col sm:flex-row justify-between text-sm font-bold gap-1 pb-3 border-b border-gray-100">
                        <span className="text-gray-600 flex items-center gap-1.5">
                            <CalendarDays size={16} className="text-blue-500" />
                            Tổng quỹ lương tháng {currentMonth} đã chi (Q8):
                        </span>
                        <span className="text-blue-700 text-base">{tongLuongThang.q8.toLocaleString()}đ</span>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between text-sm font-bold gap-1">
                        <span className="text-[#0B1E3F]">
                            Đã chi tuần này (Q8): {customTotalSpent.toLocaleString()}đ 
                            <span className="text-gray-500 font-normal ml-2">({customTotalHours} giờ làm)</span>
                        </span>
                        <span className={`text-xs sm:text-sm font-bold ${statusTextColor}`}>
                            {percentage.toFixed(1)}% ({percentage > 100 ? 'Vượt ngân sách' : percentage >= 90 ? 'Cảnh báo mức cao' : 'Trong tầm an toàn'})
                        </span>
                    </div>

                    {/* Thanh tiến độ đổi màu linh hoạt */}
                    <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden border border-gray-200">
                        <div 
                            className={`h-4 transition-all duration-500 ${barColor}`} 
                            style={{ width: `${progressWidth}%` }}
                        ></div>
                    </div>

                    {percentage > 100 && (
                        <p className="text-xs text-red-600 font-bold animate-pulse">
                            CẢNH BÁO: Tổng quỹ lương đã vượt quá mức cho phép ({percentage.toFixed(1)}%)!
                        </p>
                    )}
                </div>
            </div>

            {/* Bảng Chi Tiết Lương 3 Thẻ / Hàng */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-extrabold text-[#0B1E3F] uppercase">Chi Tiết Lương Nhân Sự (Tích chọn để tính vào Quỹ Q8)</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Object.values(groupedShifts).map((emp) => {
                        const isChecked = !!selectedEmployees[emp.id_nguoi_dung];
                        return (
                            <div 
                                key={emp.id_nguoi_dung} 
                                className={`bg-white border rounded-xl flex flex-col overflow-hidden shadow-sm transition ${
                                    isChecked ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 opacity-70'
                                }`}
                            >
                                {/* Header: Tên và Ô Tích Chọn */}
                                <div className="bg-[#0B1E3F] text-white p-3 flex justify-between items-center">
                                    <span className="text-sm font-extrabold truncate max-w-[150px] uppercase tracking-wide" title={emp.ho_ten}>
                                        {emp.ho_ten}
                                    </span>
                                    <button 
                                        type="button" 
                                        onClick={() => toggleEmployee(emp.id_nguoi_dung)}
                                        className="text-[#FFD166] hover:scale-110 transition flex items-center gap-1.5 text-xs font-semibold border border-white/20 bg-white/10 px-2.5 py-1 rounded"
                                    >
                                        {isChecked ? <CheckSquare size={14}/> : <Square size={14}/>}
                                        {isChecked ? 'Tính quỹ' : 'Bỏ qua'}
                                    </button>
                                </div>
                                
                                {/* Danh sách ca làm có kèm số giờ và số tiền từng ca */}
                                <div className="flex-1 p-2 space-y-2 max-h-[220px] overflow-y-auto bg-gray-50 text-xs">
                                    {emp.shifts.length > 0 ? (
                                        emp.shifts.map((s, i) => {
                                            const d = new Date(s.thoi_gian_bat_dau);
                                            const isQ8 = s.id_chi_nhanh === 1;
                                            const shiftHours = Number(s.so_gio_lam_thuong) + Number(s.so_gio_tang_ca_dem);
                                            const tienCaLam = Number(s.luong_thuc_lanh);
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`flex items-center justify-between border-b pb-1.5 pt-1.5 ${
                                                        isQ8 ? 'text-[#0B1E3F]' : 'text-gray-400 line-through'
                                                    }`}
                                                >
                                                    <span className="font-bold w-8">{d.getDate()}/{d.getMonth() + 1}</span>
                                                    <span className="w-16 text-center">{d.getHours()}h - {new Date(s.thoi_gian_ket_thuc).getHours()}h</span>
                                                    <div className="flex items-center gap-1 w-14 justify-center">
                                                        <span className="text-[10px] text-gray-500">({shiftHours}h)</span>
                                                        <span className={`font-bold px-1 rounded text-[10px] ${
                                                            isQ8 ? 'bg-[#FFD166]/60 text-[#0B1E3F]' : 'bg-gray-200 text-gray-500'
                                                        }`}>
                                                            {isQ8 ? 'Q8' : 'F1'}
                                                        </span>
                                                    </div>
                                                    <span className={`font-bold text-right w-16 ${isQ8 ? 'text-blue-700' : 'text-gray-400'}`}>
                                                        {tienCaLam.toLocaleString()}đ
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="flex items-center justify-center h-full min-h-[60px] text-gray-400 italic font-medium">
                                            Không có ca làm trong tuần này.
                                        </div>
                                    )}
                                </div>

                                {/* Footer tổng giờ & tổng tiền */}
                                <div className="bg-yellow-50/80 p-3 text-xs font-bold space-y-1.5 border-t border-yellow-200">
                                    <div className="flex justify-between text-gray-700 text-[11px] items-center">
                                        <span className="flex items-center gap-1 font-semibold"><Clock size={12}/> Tổng giờ làm:</span>
                                        <span className="text-blue-700 font-extrabold text-xs">{emp.tongGioTatCa}h</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 text-[11px] items-center">
                                        <span className="font-semibold">Lương ca Q8:</span>
                                        <span className="font-bold">{emp.tongTienQ8.toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex justify-between text-[#0B1E3F] text-sm pt-2 border-t border-yellow-300 items-center">
                                        <span className="font-extrabold">Thực lãnh:</span>
                                        <span className="font-black">{emp.shifts.reduce((t, x) => t + Number(x.luong_thuc_lanh), 0).toLocaleString()}đ</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}