import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../../api/axiosClient';
import { X, Save, Trash2, Clock, Plus, Settings, Edit, Check, RefreshCw, Wallet } from 'lucide-react';
import { io } from 'socket.io-client';

const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000' 
    : 'https://quan-ly-cham-cong.onrender.com';
const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// CƠ CHẾ SỬA LỖI MÚI GIỜ: Bóc tách trực tiếp chuỗi số chống lệch 7 tiếng
function parseMySqlDateTime(dateTimeStr) {
    if (!dateTimeStr) return { year: 0, month: 0, day: 0, hour: 0, minute: 0, dateKey: '' };
    if (isLocal) {
        const d = new Date(dateTimeStr);
        const year = d.getFullYear(); const month = d.getMonth() + 1; const day = d.getDate();
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return { year, month, day, hour: d.getHours(), minute: d.getMinutes(), dateKey };
    } else {
        const cleaned = String(dateTimeStr).replace('T', ' ').replace('Z', '').split('.')[0];
        const [datePart, timePart] = cleaned.split(' ');
        let year = 0, month = 0, day = 0, hour = 0, minute = 0;
        if (datePart) {
            const parts = datePart.split('-');
            if (parts.length === 3) { year = parseInt(parts[0], 10); month = parseInt(parts[1], 10); day = parseInt(parts[2], 10); }
        }
        if (timePart) {
            const timeParts = timePart.split(':');
            if (timeParts.length >= 2) { hour = parseInt(timeParts[0], 10); minute = parseInt(timeParts[1], 10); }
        }
        const dateKey = (year && month && day) ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
        return { year, month, day, hour, minute, dateKey };
    }
}

function WheelTimePicker({ hour, minute, onHourChange, onMinuteChange, label, minHour = 0, maxHour = 23 }) {
    const [isEditingH, setIsEditingH] = useState(false);
    const [tempH, setTempH] = useState(String(hour).padStart(2, '0'));
    const [isEditingM, setIsEditingM] = useState(false);
    const [tempM, setTempM] = useState(String(minute).padStart(2, '0'));
    
    const hourContainerRef = useRef(null); const minuteContainerRef = useRef(null);
    const hourRef = useRef(hour); hourRef.current = hour;
    const minuteRef = useRef(minute); minuteRef.current = minute;

    useEffect(() => { setTempH(String(hour).padStart(2, '0')); }, [hour]);
    useEffect(() => { setTempM(String(minute).padStart(2, '0')); }, [minute]);

    useEffect(() => {
        const hourEl = hourContainerRef.current; const minuteEl = minuteContainerRef.current;
        const handleHourWheel = (e) => {
            e.preventDefault();
            let nextH = e.deltaY > 0 ? hourRef.current + 1 : hourRef.current - 1;
            if (nextH < minHour) nextH = maxHour; if (nextH > maxHour) nextH = minHour;
            onHourChange(nextH);
        };
        const handleMinuteWheel = (e) => {
            e.preventDefault();
            let nextM = e.deltaY > 0 ? minuteRef.current + 1 : minuteRef.current - 1;
            if (nextM < 0) nextM = 59; if (nextM > 59) nextM = 0;
            onMinuteChange(nextM);
        };
        if (hourEl) hourEl.addEventListener('wheel', handleHourWheel, { passive: false });
        if (minuteEl) minuteEl.addEventListener('wheel', handleMinuteWheel, { passive: false });
        return () => {
            if (hourEl) hourEl.removeEventListener('wheel', handleHourWheel);
            if (minuteEl) minuteEl.removeEventListener('wheel', handleMinuteWheel);
        };
    }, [minHour, maxHour, onHourChange, onMinuteChange]);

    const handleBlurH = () => {
        setIsEditingH(false);
        let num = parseInt(tempH, 10);
        if (isNaN(num)) num = hour;
        if (num < minHour) num = minHour; if (num > maxHour) num = maxHour;
        setTempH(String(num).padStart(2, '0')); onHourChange(num);
    };

    const handleBlurM = () => {
        setIsEditingM(false);
        let num = parseInt(tempM, 10);
        if (isNaN(num)) num = minute;
        if (num < 0) num = 0; if (num > 59) num = 59;
        setTempM(String(num).padStart(2, '0')); onMinuteChange(num);
    };

    const prevH = hour - 1 < minHour ? maxHour : hour - 1; const nextH = hour + 1 > maxHour ? minHour : hour + 1;
    const prevM = minute - 1 < 0 ? 59 : minute - 1; const nextM = minute + 1 > 59 ? 0 : minute + 1;

    return (
        <div className="space-y-1">
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase text-center">{label}</label>
            <div className="flex items-center justify-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl p-2 shadow-inner">
                <div ref={hourContainerRef} className="flex flex-col items-center justify-center select-none cursor-ns-resize px-1">
                    <div onClick={() => onHourChange(prevH)} className="text-gray-300 text-xs font-semibold hover:text-gray-500 py-0.5 cursor-pointer">{String(prevH).padStart(2, '0')}</div>
                    <div>
                        {isEditingH ? (
                            <input type="number" autoFocus value={tempH} onChange={(e) => setTempH(e.target.value)} onBlur={handleBlurH} onKeyDown={(e) => { if (e.key === 'Enter') handleBlurH(); }} onFocus={(e) => e.target.select()} className="w-10 bg-white border-2 border-blue-500 rounded-lg text-base font-black text-[#0B1E3F] text-center outline-none"/>
                        ) : (
                            <div onClick={() => setIsEditingH(true)} className="text-xl font-black text-[#0B1E3F] bg-white px-2 py-0.5 rounded-lg border border-gray-200 shadow-xs hover:border-blue-400 cursor-pointer">{String(hour).padStart(2, '0')}</div>
                        )}
                    </div>
                    <div onClick={() => onHourChange(nextH)} className="text-gray-300 text-xs font-semibold hover:text-gray-500 py-0.5 cursor-pointer">{String(nextH).padStart(2, '0')}</div>
                </div>
                <span className="font-black text-gray-400 text-lg pb-0.5">:</span>
                <div ref={minuteContainerRef} className="flex flex-col items-center justify-center select-none cursor-ns-resize px-1">
                    <div onClick={() => onMinuteChange(prevM)} className="text-gray-300 text-xs font-semibold hover:text-gray-500 py-0.5 cursor-pointer">{String(prevM).padStart(2, '0')}</div>
                    <div>
                        {isEditingM ? (
                            <input type="number" autoFocus value={tempM} onChange={(e) => setTempM(e.target.value)} onBlur={handleBlurM} onKeyDown={(e) => { if (e.key === 'Enter') handleBlurM(); }} onFocus={(e) => e.target.select()} className="w-10 bg-white border-2 border-blue-500 rounded-lg text-base font-black text-[#0B1E3F] text-center outline-none"/>
                        ) : (
                            <div onClick={() => setIsEditingM(true)} className="text-xl font-black text-[#0B1E3F] bg-white px-2 py-0.5 rounded-lg border border-gray-200 shadow-xs hover:border-blue-400 cursor-pointer">{String(minute).padStart(2, '0')}</div>
                        )}
                    </div>
                    <div onClick={() => onMinuteChange(nextM)} className="text-gray-300 text-xs font-semibold hover:text-gray-500 py-0.5 cursor-pointer">{String(nextM).padStart(2, '0')}</div>
                </div>
            </div>
        </div>
    );
}

export default function ScheduleTab({ week }) {
    const [lichLam, setLichLam] = useState([]);
    const [dangKyCa, setDangKyCa] = useState([]);
    const [nhanVienList, setNhanVienList] = useState([]);
    const [chiNhanhList, setChiNhanhList] = useState([]);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hoveredColReg, setHoveredColReg] = useState(null); 
    const [hoveredColShift, setHoveredColShift] = useState(null); 
    
    const [holidayMultipliers, setHolidayMultipliers] = useState({});

    const userRole = (localStorage.getItem('vai_tro') || '').trim().toUpperCase();
    const isManager = userRole === 'QUAN_LY' || userRole === 'QUẢN LÝ' || userRole === 'ADMIN' || userRole === 'MANAGER';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedShiftId, setSelectedShiftId] = useState(null);

    const [isRegModalOpen, setIsRegModalOpen] = useState(false);
    const [regModalMode, setRegModalMode] = useState('add');
    const [selectedRegId, setSelectedRegId] = useState(null);

    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [branchForm, setBranchForm] = useState({ id: '', ten_chi_nhanh: '', luong_co_ban_mot_gio: 25000, phu_cap_theo_gio: 0, phu_cap_co_dinh: 0, khau_tru_theo_gio: 0, ly_do_khau_tru: '' });
    const [isEditingBranch, setIsEditingBranch] = useState(false);

    const [formData, setFormData] = useState({
        id_nguoi_dung: '', ho_ten: '', ngay_lam: '', gio_bat_dau_h: 8, gio_bat_dau_m: 0, gio_ket_thuc_h: 12, gio_ket_thuc_m: 0, id_chi_nhanh: '1', he_so_ngay_le: 1
    });

    const [budgetStatsList, setBudgetStatsList] = useState([]);

    const getWeekDates = (startDateString) => {
        const dates = [];
        const [year, month, day] = startDateString.split('-');
        let currentDate = new Date(year, month - 1, day);
        for (let i = 0; i < 7; i++) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };
    const formatDateKey = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    const weekDates = getWeekDates(week.start);

    const loadAllData = async () => {
        setIsRefreshing(true);
        await Promise.all([
            fetchRegistrations(week.start, week.end),
            fetchShifts(week.start, week.end),
            fetchMonthlyBudgetStats(week.start, week.end) 
        ]);
        setTimeout(() => setIsRefreshing(false), 500); 
    };

    useEffect(() => {
        fetchEmployees(); fetchBranches(); loadAllData();
    }, [week]);

    useEffect(() => {
        const handleUpdate = () => { loadAllData(); };
        socket.on('update_schedule', handleUpdate);
        return () => {
            socket.off('update_schedule', handleUpdate);
        };
    }, [week]);

    useEffect(() => {
        setHolidayMultipliers(prev => {
            const next = { ...prev };
            lichLam.forEach(ca => {
                if (Number(ca.he_so_ngay_le) > 1) {
                    const parsed = parseMySqlDateTime(ca.thoi_gian_bat_dau);
                    if (!next[parsed.dateKey]) next[parsed.dateKey] = Number(ca.he_so_ngay_le);
                }
            });
            return next;
        });
    }, [lichLam]);

    const fetchBranches = async () => {
        try {
            const res = await axiosClient.get('/branches');
            setChiNhanhList(res.data);
            if (res.data.length > 0 && !formData.id_chi_nhanh) {
                setFormData(prev => ({ ...prev, id_chi_nhanh: res.data[0].id.toString() }));
            }
        } catch (err) {}
    };

    const fetchEmployees = async () => {
        try {
            const res = await axiosClient.get('/users');
            setNhanVienList(res.data);
        } catch (err) {}
    };

    // THUẬT TOÁN TRỢ LÝ THÔNG MINH MỚI (Khóa tuần quá khứ, Chia tiền tuần đủ)
    const fetchMonthlyBudgetStats = async (startStr, endStr) => {
        try {
            // Xác định Thứ 2 của tuần hiện tại (ngoài đời thực) để chốt các tuần đã qua
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const currentDay = today.getDay();
            const diffToMonday = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
            const realMonday = new Date(today);
            realMonday.setDate(diffToMonday);
            const realMondayStr = formatDateKey(realMonday);

            const weekDatesArr = getWeekDates(startStr);
            const uniqueMonthsMap = new Map();
            weekDatesArr.forEach(d => {
                const k = `${d.getFullYear()}-${d.getMonth() + 1}`;
                if (!uniqueMonthsMap.has(k)) {
                    uniqueMonthsMap.set(k, { y: d.getFullYear(), m: d.getMonth() + 1 });
                }
            });

            const uniqueMonths = Array.from(uniqueMonthsMap.values());
            const statsArray = [];

            for (const {y, m} of uniqueMonths) {
                const firstDayOfMonth = new Date(y, m - 1, 1);
                const lastDayOfMonth = new Date(y, m, 0);
                
                // Đồng bộ bộ khung Tuần T2-CN
                const startMon = new Date(firstDayOfMonth);
                const dayOfWeek = startMon.getDay();
                const diff = startMon.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                startMon.setDate(diff);

                const monthWeeks = [];
                let curr = new Date(startMon);
                while (curr <= lastDayOfMonth) {
                    const weekDays = [];
                    for (let i = 0; i < 7; i++) {
                        weekDays.push(new Date(curr));
                        curr.setDate(curr.getDate() + 1);
                    }
                    monthWeeks.push(weekDays);
                }

                // Tải dữ liệu ca của cả tháng
                const fetchStart = formatDateKey(monthWeeks[0][0]);
                const fetchEnd = formatDateKey(monthWeeks[monthWeeks.length - 1][6]);
                const res = await axiosClient.get('/shifts', { params: { startDate: `${fetchStart} 00:00:00`, endDate: `${fetchEnd} 23:59:59` } });
                
                const shiftsParsed = res.data.map(s => ({ ...s, dateKey: parseMySqlDateTime(s.thoi_gian_bat_dau).dateKey }));

                let viewedIdx = monthWeeks.findIndex(w => formatDateKey(w[0]) === week.start);
                if (viewedIdx === -1) continue;

                let pastSpent = 0;             
                let futurePartialLimits = 0;   
                let futureFullWeightSum = 0;   
                let totalMonthSpent = 0;       

                let viewedWeekStats = null;

                monthWeeks.forEach(wDays => {
                    let daysInMonth = 0;
                    let baseLimit = 0;
                    let actualSpent = 0;

                    const wStartStr = formatDateKey(wDays[0]);
                    const isPastReal = wStartStr < realMondayStr; // Tuần đã qua ngoài đời
                    const isViewed = wStartStr === week.start;    // Tuần đang xem

                    wDays.forEach(d => {
                        if (d.getMonth() + 1 === m) {
                            daysInMonth++;
                            const dow = d.getDay();
                            const dKey = formatDateKey(d);

                            // Nhận diện hệ số Lễ
                            let multiplier = 1;
                            if (isViewed && holidayMultipliers[dKey]) {
                                multiplier = holidayMultipliers[dKey];
                            } else {
                                const dayShifts = shiftsParsed.filter(s => s.dateKey === dKey);
                                const hasHoliday = dayShifts.some(s => Number(s.he_so_ngay_le) > 1);
                                if (hasHoliday) multiplier = 2; 
                            }

                            // Định giá cứng từng ngày
                            let dayValue = 500000;
                            if (dow === 6) dayValue = 650000;
                            if (dow === 0) dayValue = 850000;
                            
                            // Ngày Lễ -> Đẩy trọng số lên bằng Chủ Nhật
                            if (multiplier > 1) dayValue = Math.max(dayValue, 850000);
                            
                            baseLimit += dayValue;

                            // Tính thực chi (Lương cơ bản x Giờ)
                            const dayShiftsActual = shiftsParsed.filter(s => s.dateKey === dKey);
                            dayShiftsActual.forEach(s => {
                                const name = (s.ho_ten || '').toLowerCase();
                                const isFixed = name.includes('bích ngọc') || name.includes('văn hiền') || s.id_nguoi_dung === 1 || s.id_nguoi_dung === 2;
                                if (!isFixed && Number(s.id_chi_nhanh) === 1) {
                                    const shiftHours = Number(s.so_gio_lam_thuong) + Number(s.so_gio_tang_ca_dem);
                                    const baseWage = Number(s.luong_co_ban_luu_tru) || 0;
                                    actualSpent += (shiftHours * baseWage);
                                }
                            });
                        }
                    });

                    totalMonthSpent += actualSpent;
                    const isFull = daysInMonth === 7;

                    if (isPastReal) {
                        pastSpent += actualSpent; // Tuần đã qua chốt cứng bằng thực chi
                    } else { 
                        if (!isFull) {
                            futurePartialLimits += baseLimit; // Tuần thiếu tương lai khóa hạn mức cứng
                        } else {
                            futureFullWeightSum += baseLimit; // Tuần đủ tương lai cộng dồn trọng số
                        }
                    }

                    if (isViewed) {
                        viewedWeekStats = { isFull, baseLimit, actualSpent, daysInMonth, isPastReal };
                    }
                });

                if (viewedWeekStats) {
                    let allocatedThisWeek = 0;

                    if (viewedWeekStats.isPastReal) {
                        // NẾU LÀ TUẦN ĐÃ QUA THÌ CHỐT HẠN MỨC BẰNG THỰC CHI
                        allocatedThisWeek = viewedWeekStats.actualSpent;
                    } else {
                        if (!viewedWeekStats.isFull) {
                            // Tuần hiện tại/tương lai mà bị thiếu ngày -> Cấp hạn mức cứng
                            allocatedThisWeek = viewedWeekStats.baseLimit;
                        } else {
                            // Tuần hiện tại/tương lai đủ ngày -> Chia đều từ Quỹ còn lại
                            const remainingBudget = Math.max(0, 10000000 - pastSpent - futurePartialLimits);
                            if (futureFullWeightSum > 0) {
                                allocatedThisWeek = remainingBudget * (viewedWeekStats.baseLimit / futureFullWeightSum);
                            } else {
                                allocatedThisWeek = remainingBudget;
                            }
                            // Mức Sàn 2.1 TR/TUẦN (Chỉ áp dụng khi quỹ cho phép)
                            allocatedThisWeek = Math.max(allocatedThisWeek, 2100000); 
                            allocatedThisWeek = Math.min(allocatedThisWeek, remainingBudget);
                        }
                    }

                    statsArray.push({
                        allocatedThisWeek,
                        spentThisWeek: viewedWeekStats.actualSpent,
                        spentTotalMonth: totalMonthSpent,
                        targetMonth: m,
                        targetYear: y,
                        daysInWeekForMonth: viewedWeekStats.daysInMonth,
                        isFull: viewedWeekStats.isFull,
                        isPastSegment: viewedWeekStats.isPastReal
                    });
                }
            }

            setBudgetStatsList(statsArray);

        } catch (error) {}
    };

    const fetchRegistrations = async (start, end) => {
        try {
            const res = await axiosClient.get('/shifts/registrations', { params: { startDate: start, endDate: end } });
            const grouped = {};
            res.data.forEach(curr => {
                if (!grouped[curr.id_nguoi_dung]) grouped[curr.id_nguoi_dung] = { raw: {}, data: {} };
                const dayOfWeek = new Date(curr.ngay_dang_ky).getDay();
                const dayKey = dayOfWeek === 0 ? 'cn' : `t${dayOfWeek + 1}`;
                const [sH, sM] = curr.gio_bat_dau.split(':').map(Number);
                const [eH, eM] = curr.gio_ket_thuc.split(':').map(Number);
                const sStr = sM > 0 ? `${sH}h${String(sM).padStart(2, '0')}` : `${sH}h`;
                const eStr = eM > 0 ? `${eH}h${String(eM).padStart(2, '0')}` : `${eH}h`;
                grouped[curr.id_nguoi_dung].raw[dayKey] = curr;
                grouped[curr.id_nguoi_dung].data[dayKey] = (sH === 8 && eH >= 22) ? 'Full' : `${sStr}-${eStr}`;
            });
            setDangKyCa(grouped);
        } catch (err) {}
    };

    const fetchShifts = async (start, end) => {
        try {
            const res = await axiosClient.get('/shifts', { params: { startDate: `${start} 00:00:00`, endDate: `${end} 23:59:59` } });
            setLichLam(res.data);
        } catch (err) {}
    };

    const handleCellClickRegistration = (nhanVien, dateKey, existingReg) => {
        if (existingReg) {
            setRegModalMode('edit'); setSelectedRegId(existingReg.id);
            const [sH, sM] = existingReg.gio_bat_dau.split(':').map(Number);
            const [eH, eM] = existingReg.gio_ket_thuc.split(':').map(Number);
            setFormData({
                id_nguoi_dung: nhanVien.id, ho_ten: nhanVien.ho_ten, ngay_lam: dateKey,
                gio_bat_dau_h: isNaN(sH) ? 8 : sH, gio_bat_dau_m: isNaN(sM) ? 0 : sM,
                gio_ket_thuc_h: isNaN(eH) ? 22 : eH, gio_ket_thuc_m: isNaN(eM) ? 0 : eM, id_chi_nhanh: formData.id_chi_nhanh, he_so_ngay_le: 1
            });
        } else {
            setRegModalMode('add'); setSelectedRegId(null);
            setFormData({
                id_nguoi_dung: nhanVien.id, ho_ten: nhanVien.ho_ten, ngay_lam: dateKey,
                gio_bat_dau_h: 8, gio_bat_dau_m: 0, gio_ket_thuc_h: 22, gio_ket_thuc_m: 0, id_chi_nhanh: formData.id_chi_nhanh, he_so_ngay_le: 1
            });
        }
        setIsRegModalOpen(true);
    };

    const handleSelectFullDayRegistration = () => { setFormData(prev => ({ ...prev, gio_bat_dau_h: 8, gio_bat_dau_m: 0, gio_ket_thuc_h: 22, gio_ket_thuc_m: 0 })); };

    const handleSaveRegistration = async (e) => {
        e.preventDefault();
        const sH = Number(formData.gio_bat_dau_h); const sM = Number(formData.gio_bat_dau_m);
        const eH = Number(formData.gio_ket_thuc_h); const eM = Number(formData.gio_ket_thuc_m);
        if ((eH * 60 + eM) <= (sH * 60 + sM) || (eH * 60 + eM) > 24 * 60) { alert("Lỗi: Thời gian kết thúc phải lớn hơn bắt đầu và không quá 24h00!"); return; }
        const gio_bat_dau = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}:00`;
        const gio_ket_thuc = `${eH === 24 ? '23:59' : String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}:00`;

        try {
            if (regModalMode === 'add') { await axiosClient.post('/shifts/registrations', { id_nguoi_dung: formData.id_nguoi_dung, ngay_dang_ky: formData.ngay_lam, gio_bat_dau, gio_ket_thuc }); } 
            else { await axiosClient.put(`/shifts/registrations/${selectedRegId}`, { id_nguoi_dung: formData.id_nguoi_dung, gio_bat_dau, gio_ket_thuc }); }
            setIsRegModalOpen(false); socket.emit('schedule_changed'); 
        } catch (err) { alert("Lỗi khi lưu đăng ký ca!"); }
    };

    const handleDeleteRegistration = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đăng ký này?")) return;
        try { await axiosClient.delete(`/shifts/registrations/${selectedRegId}`); setIsRegModalOpen(false); socket.emit('schedule_changed'); } 
        catch (err) { alert("Lỗi khi hủy đăng ký!"); }
    };

    const handleOpenAdd = (nhanVien, dateKey) => {
        if (!isManager) { alert("Chỉ có quản lý mới được phép xếp lịch!"); return; }
        setModalMode('add');
        setFormData({
            id_nguoi_dung: nhanVien.id, ho_ten: nhanVien.ho_ten, ngay_lam: dateKey,
            gio_bat_dau_h: 8, gio_bat_dau_m: 0, gio_ket_thuc_h: 12, gio_ket_thuc_m: 0,
            id_chi_nhanh: chiNhanhList.length > 0 ? chiNhanhList[0].id.toString() : '1',
            he_so_ngay_le: holidayMultipliers[dateKey] || 1
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (e, nhanVien, dateKey, shift) => {
        e.stopPropagation(); 
        if (!isManager) { alert("Chỉ quản lý mới được sửa lịch!"); return; }
        setModalMode('edit'); setSelectedShiftId(shift.id);
        const startParsed = parseMySqlDateTime(shift.thoi_gian_bat_dau); const endParsed = parseMySqlDateTime(shift.thoi_gian_ket_thuc);
        setFormData({
            id_nguoi_dung: nhanVien.id, ho_ten: nhanVien.ho_ten, ngay_lam: dateKey,
            gio_bat_dau_h: startParsed.hour, gio_bat_dau_m: startParsed.minute,
            gio_ket_thuc_h: endParsed.hour, gio_ket_thuc_m: endParsed.minute,
            id_chi_nhanh: shift.id_chi_nhanh.toString(),
            he_so_ngay_le: shift.he_so_ngay_le || 1
        });
        setIsModalOpen(true);
    };

    const handleStartHourChange = (newH) => {
        const h = Math.max(0, Math.min(23, Number(newH) || 0));
        setFormData(prev => ({ ...prev, gio_bat_dau_h: h }));
    };

    const handleSaveShift = async (e) => {
        e.preventDefault();
        const sH = Number(formData.gio_bat_dau_h); const sM = Number(formData.gio_bat_dau_m);
        const eH = Number(formData.gio_ket_thuc_h); const eM = Number(formData.gio_ket_thuc_m);

        if ((eH * 60 + eM) <= (sH * 60 + sM) || (eH * 60 + eM) > 24 * 60) { alert("Lỗi: Thời gian kết thúc phải lớn hơn bắt đầu và không quá 24h00!"); return; }

        let finalEndH = eH; let endDateStr = formData.ngay_lam;
        if (finalEndH === 24) { finalEndH = 0; const d = new Date(formData.ngay_lam); d.setDate(d.getDate() + 1); endDateStr = formatDateKey(d); }

        const thoi_gian_bat_dau = `${formData.ngay_lam} ${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}:00`;
        const thoi_gian_ket_thuc = `${endDateStr} ${String(finalEndH).padStart(2, '0')}:${String(eM).padStart(2, '0')}:00`;

        try {
            if (modalMode === 'add') {
                await axiosClient.post('/shifts/schedule', { id_nguoi_dung: formData.id_nguoi_dung, id_chi_nhanh: formData.id_chi_nhanh, thoi_gian_bat_dau, thoi_gian_ket_thuc, he_so_ngay_le: formData.he_so_ngay_le });
            } else {
                await axiosClient.put(`/shifts/update/${selectedShiftId}`, { id_chi_nhanh: formData.id_chi_nhanh, thoi_gian_bat_dau, thoi_gian_ket_thuc, he_so_ngay_le: formData.he_so_ngay_le });
            }
            setIsModalOpen(false); socket.emit('schedule_changed'); 
        } catch (err) { alert(`Lỗi: ${err.response?.data?.error || err.message}`); }
    };

    const handleDeleteShift = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa ca làm này?")) return;
        try { await axiosClient.delete(`/shifts/delete/${selectedShiftId}`); setIsModalOpen(false); socket.emit('schedule_changed'); } 
        catch (err) { alert("Lỗi khi xóa ca làm!"); }
    };

    const handleSaveBranch = async (e) => {
        e.preventDefault();
        try {
            if (isEditingBranch) await axiosClient.put(`/branches/${branchForm.id}`, branchForm); else await axiosClient.post('/branches', branchForm);
            fetchBranches(); setBranchForm({ id: '', ten_chi_nhanh: '', luong_co_ban_mot_gio: 25000, phu_cap_theo_gio: 0, phu_cap_co_dinh: 0, khau_tru_theo_gio: 0, ly_do_khau_tru: '' }); setIsEditingBranch(false);
        } catch (err) { alert("Lỗi lưu chi nhánh!"); }
    };

    const handleDeleteBranch = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa chi nhánh này?")) return;
        try { await axiosClient.delete(`/branches/${id}`); fetchBranches(); } catch (err) { alert("Không thể xóa chi nhánh đang có dữ liệu!"); }
    };

    const shiftsByUserIdAndDate = lichLam.reduce((acc, ca) => {
        if (!acc[ca.id_nguoi_dung]) acc[ca.id_nguoi_dung] = {};
        const parsed = parseMySqlDateTime(ca.thoi_gian_bat_dau);
        if (parsed.dateKey) {
            if (!acc[ca.id_nguoi_dung][parsed.dateKey]) acc[ca.id_nguoi_dung][parsed.dateKey] = [];
            acc[ca.id_nguoi_dung][parsed.dateKey].push(ca);
        }
        return acc;
    }, {});

    const nhanVienDangKyList = nhanVienList.filter(nv => !((nv.ho_ten || '').toLowerCase().includes('bích ngọc') || (nv.ho_ten || '').toLowerCase().includes('văn hiền')));

    return (
        <div className="space-y-4 text-xs px-4 sm:px-6">
            {/* 1. BẢNG ĐĂNG KÝ NGUYỆN VỌNG */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2">
                    <h2 className="text-xs font-extrabold text-[#0B1E3F] uppercase flex items-center gap-2">
                        1. Đăng Ký Lịch Làm Việc Tuần Này
                        <button onClick={loadAllData} disabled={isRefreshing} className="p-1.5 hover:bg-gray-200 rounded-full text-blue-600 ml-1 cursor-pointer" title="Tải lại dữ liệu">
                            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                    </h2>
                    <span className="text-[10px] text-gray-500 font-medium italic">* Nhấp vào ô trống để đăng ký mới, nhấp vào ô đã có lịch để sửa hoặc hủy</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse border border-slate-300 min-w-[700px]" onMouseLeave={() => setHoveredColReg(null)}>
                        <thead className="bg-[#0B1E3F] text-white uppercase text-[11px]">
                            <tr>
                                <th className="p-2 border border-slate-300 text-left sticky left-0 bg-[#0B1E3F] z-10 w-28 sm:w-40 align-middle">HỌ VÀ TÊN</th>
                                {weekDates.map((date, index) => {
                                    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                                    return (
                                        <th 
                                            key={index} 
                                            onMouseEnter={() => setHoveredColReg(index)} 
                                            className={`p-1.5 border border-slate-300 w-20 sm:w-24 align-middle ${hoveredColReg === index ? 'bg-[#1D3557]' : 'bg-[#0B1E3F]'}`}
                                        >
                                            <div className="font-bold">{dayNames[date.getDay()]}</div>
                                            <div className="text-[9px] text-[#FFD166] mt-0.5">{date.getDate()}/{date.getMonth() + 1}</div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {nhanVienDangKyList.map((nv) => {
                                const regObj = dangKyCa[nv.id] || { raw: {}, data: {} };
                                return (
                                    <tr key={nv.id} className="group hover:bg-slate-100">
                                        <td className="p-2 font-bold text-[#0B1E3F] border border-slate-300 text-left sticky left-0 bg-white group-hover:bg-slate-100 z-10 truncate max-w-[120px] text-[11px]">
                                            {nv.ho_ten}
                                        </td>
                                        {weekDates.map((date, index) => {
                                            const dayKeys = ['cn', 't2', 't3', 't4', 't5', 't6', 't7'];
                                            const dKey = dayKeys[date.getDay()];
                                            const textVal = regObj.data[dKey];
                                            const existingReg = regObj.raw[dKey];
                                            const bgClass = hoveredColReg === index ? 'bg-slate-100' : 'bg-white';

                                            return (
                                                <td 
                                                    key={index} 
                                                    onMouseEnter={() => setHoveredColReg(index)} 
                                                    onClick={() => handleCellClickRegistration(nv, formatDateKey(date), existingReg)} 
                                                    className={`p-1 align-middle min-h-[45px] cursor-pointer border border-slate-300 group-hover:bg-slate-100 ${bgClass}`}
                                                >
                                                    <div className="flex flex-col gap-0.5 items-center justify-center">
                                                        {textVal ? <div className="font-bold text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-1 py-0.5 mx-auto max-w-fit shadow-2xs">{textVal}</div> : <span className="text-gray-300 text-[10px]">-</span>}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. BẢNG LỊCH THỰC TẾ */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                <div className="p-3 bg-[#FFF8E7] border-b border-gray-200 flex justify-between items-center flex-wrap gap-2">
                    <h2 className="text-xs font-extrabold text-[#0B1E3F] uppercase flex items-center gap-2">
                        2. Bảng Lịch Làm Việc Thực Tế
                        <button onClick={loadAllData} disabled={isRefreshing} className="p-1.5 hover:bg-amber-200 rounded-full text-amber-700 ml-1 cursor-pointer" title="Tải lại dữ liệu">
                            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                    </h2>
                    <span className="text-[10px] text-gray-500 font-medium italic">{isManager ? "* Quản lý nhấp vào ô trống để thêm ca, nhấp vào ca để sửa/xóa" : "* Chỉ Quản lý mới có quyền thao tác lịch làm việc thực tế"}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse border border-slate-300 min-w-[700px]" onMouseLeave={() => setHoveredColShift(null)}>
                        <thead className="bg-[#0B1E3F] text-white uppercase text-[11px]">
                            <tr>
                                <th className="p-2 border border-slate-300 text-left sticky left-0 bg-[#0B1E3F] z-10 w-28 sm:w-40 align-middle">HỌ VÀ TÊN</th>
                                {weekDates.map((date, index) => {
                                    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                                    const dKey = formatDateKey(date);
                                    const isHoliday = holidayMultipliers[dKey] > 1;

                                    return (
                                        <th 
                                            key={index} 
                                            onMouseEnter={() => setHoveredColShift(index)} 
                                            className={`p-1.5 border border-slate-300 w-20 sm:w-24 align-middle ${hoveredColShift === index ? 'bg-[#1D3557]' : (isHoliday ? 'bg-pink-900' : 'bg-[#0B1E3F]')}`}
                                        >
                                            <div className="font-bold">{dayNames[date.getDay()]}</div>
                                            <div className={`text-[9px] mt-0.5 ${isHoliday ? 'text-pink-300' : 'text-[#FFD166]'}`}>{date.getDate()}/{date.getMonth() + 1}</div>
                                            
                                            {isManager && (
                                                <select 
                                                    value={holidayMultipliers[dKey] || 1}
                                                    onChange={(e) => setHolidayMultipliers(prev => ({...prev, [dKey]: Number(e.target.value)}))}
                                                    onClick={e => e.stopPropagation()}
                                                    className={`w-full mt-1.5 p-0.5 text-[9px] font-bold text-center outline-none rounded cursor-pointer ${isHoliday ? 'bg-pink-100 text-pink-700' : 'bg-[#1D3557] text-white hover:bg-white/20'}`}
                                                >
                                                    <option value={1}>x1</option>
                                                    <option value={1.5}>Tăng ca x1.5</option>
                                                    <option value={2}>Lễ x2</option>
                                                    <option value={3}>Lễ x3</option>
                                                </select>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {nhanVienList.map((nv) => (
                                <tr key={nv.id} className="group hover:bg-slate-100">
                                    <td className="p-2 font-bold text-[#0B1E3F] border border-slate-300 text-left sticky left-0 bg-white group-hover:bg-slate-100 z-10 truncate max-w-[120px] text-[11px]">
                                        {nv.ho_ten} {nv.vai_tro === 'QUAN_LY' && <span className="text-[8px] bg-amber-100 text-amber-700 px-1 py-0.2 rounded ml-0.5 font-semibold">QL</span>}
                                    </td>
                                    {weekDates.map((date, index) => {
                                        const dKey = formatDateKey(date);
                                        const shiftsOnThisDay = shiftsByUserIdAndDate[nv.id]?.[dKey] || [];
                                        
                                        const isHoliday = holidayMultipliers[dKey] > 1;
                                        const bgClass = hoveredColShift === index ? 'bg-slate-100' : (isHoliday ? 'bg-pink-50' : 'bg-white');

                                        return (
                                            <td 
                                                key={index} 
                                                onMouseEnter={() => setHoveredColShift(index)} 
                                                onClick={() => isManager && handleOpenAdd(nv, dKey)} 
                                                className={`p-1 align-middle min-h-[45px] border border-slate-300 ${isManager ? 'cursor-pointer' : 'cursor-default'} group-hover:bg-slate-100 ${bgClass}`}
                                            >
                                                <div className="flex flex-col gap-0.5 items-center justify-center">
                                                    {shiftsOnThisDay.length > 0 ? (
                                                        <>
                                                            {shiftsOnThisDay.map((s, si) => {
                                                                const startParsed = parseMySqlDateTime(s.thoi_gian_bat_dau);
                                                                const endParsed = parseMySqlDateTime(s.thoi_gian_ket_thuc);
                                                                const sStr = startParsed.minute > 0 ? `${startParsed.hour}h${String(startParsed.minute).padStart(2, '0')}` : `${startParsed.hour}h`;
                                                                const eStr = endParsed.minute > 0 ? `${endParsed.hour}h${String(endParsed.minute).padStart(2, '0')}` : `${endParsed.hour}h`;
                                                                const heSo = Number(s.he_so_ngay_le) || 1;

                                                                return (
                                                                    <div key={si} onClick={(e) => isManager ? handleOpenEdit(e, nv, dKey, s) : e.stopPropagation()} className={`font-bold text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 mx-auto max-w-fit shadow-2xs ${isManager ? 'hover:bg-blue-100 hover:border-blue-400 cursor-pointer' : ''}`}>
                                                                        {sStr}-{eStr} 
                                                                        {Number(s.id_chi_nhanh) !== 1 && <span className="text-orange-600 text-[9px] ml-0.5">({s.ten_chi_nhanh})</span>}
                                                                        {heSo > 1 && <span className="text-pink-600 text-[9px] ml-0.5">(x{heSo})</span>}
                                                                    </div>
                                                                );
                                                            })}
                                                            {isManager && (
                                                                <button onClick={(e) => { e.stopPropagation(); handleOpenAdd(nv, dKey); }} className="mt-0.5 bg-emerald-100 hover:bg-[#0B1E3F] hover:text-emerald-400 text-emerald-700 border border-emerald-200 hover:border-[#0B1E3F] rounded px-1 py-0.2 text-[9px] font-bold shadow-2xs flex items-center gap-0.5" title="Thêm ca tiếp theo"><Plus size={9}/> Thêm ca</button>
                                                            )}
                                                        </>
                                                    ) : <span className="text-gray-300 text-[10px]">-</span>}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. TRỢ LÝ KIỂM SOÁT NGÂN SÁCH DÀNH CHO CÁC THÁNG TRONG TUẦN */}
            {isManager && budgetStatsList.map((stat, idx) => {
                const isOver = stat.spentThisWeek > stat.allocatedThisWeek && !stat.isPastSegment;
                
                return (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4">
                        <div className="p-3 bg-[#E8F0FE] border-b border-blue-100 flex justify-between items-center flex-wrap gap-2">
                            <h2 className="text-xs font-extrabold text-blue-900 uppercase flex items-center gap-2">
                                <Wallet size={16} className="text-blue-600"/> 
                                Trợ lý xếp lịch Q8 (Tháng {stat.targetMonth}/{stat.targetYear})
                            </h2>
                            <span className="text-[10px] font-bold text-blue-800 bg-blue-100/50 px-2 py-1 rounded">
                                Tổng quỹ tháng: 10.000.000đ
                            </span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-gray-600">
                                    Đã chi ({stat.daysInWeekForMonth} ngày của T{stat.targetMonth} trong tuần này): <span className="text-blue-700 text-sm ml-1">{stat.spentThisWeek.toLocaleString()}đ</span>
                                </span>
                                <span className="text-gray-600">
                                    {stat.isPastSegment
                                        ? `Hạn mức đã chốt (tuần cũ):`
                                        : stat.isFull 
                                            ? `Hạn mức gợi ý cho tuần đủ 7 ngày:` 
                                            : `Hạn mức cứng cho tuần thiếu (${stat.daysInWeekForMonth} ngày):`}
                                    <span className="text-emerald-600 text-sm ml-1">{Math.round(stat.allocatedThisWeek).toLocaleString()}đ</span>
                                </span>
                            </div>
                            
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
                                <div 
                                    className={`h-2.5 transition-all duration-500 ${isOver ? 'bg-amber-400' : 'bg-emerald-500'}`} 
                                    style={{ width: `${Math.min((stat.spentThisWeek / (stat.allocatedThisWeek || 1)) * 100, 100)}%` }}
                                ></div>
                            </div>

                            <div className="text-[10px] font-semibold italic flex flex-col sm:flex-row justify-between gap-1 mt-1">
                                <span>
                                    {stat.isPastSegment 
                                        ? <span className="text-gray-500">🔒 Tuần đã qua, hạn mức được chốt bằng số thực chi.</span>
                                        : isOver 
                                            ? <span className="text-amber-600">⚠️ Đã vượt hạn mức gợi ý. Hệ thống tự động bớt quỹ ở tuần sau để cân bằng.</span>
                                            : <span className="text-emerald-600">✅ Đang trong hạn mức an toàn, bạn có thể tiếp tục xếp lịch.</span>
                                    }
                                </span>
                                <span className="text-gray-500">
                                    Lũy kế tháng {stat.targetMonth}: {stat.spentTotalMonth.toLocaleString()}đ / 10.000.000đ
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* MODAL THÊM / SỬA ĐĂNG KÝ NGUYỆN VỌNG */}
            {isRegModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-fade-in-up my-auto">
                        <div className="p-3 bg-[#0B1E3F] text-white flex justify-between items-center">
                            <h3 className="font-bold uppercase tracking-wider text-xs">{regModalMode === 'add' ? 'Đăng Ký Nguyện Vọng' : 'Chỉnh Sửa Đăng Ký'}</h3>
                            <button onClick={() => setIsRegModalOpen(false)} className="hover:bg-white/20 p-1 rounded-md cursor-pointer"><X size={16}/></button>
                        </div>
                        <form onSubmit={handleSaveRegistration} className="p-4 space-y-3">
                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 flex justify-between items-center">
                                <div><p className="text-xs font-bold text-[#0B1E3F] mb-0.5">{formData.ho_ten}</p><p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1"><Clock size={11}/> Ngày: {formData.ngay_lam.split('-').reverse().join('/')}</p></div>
                                <button type="button" onClick={handleSelectFullDayRegistration} className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer shadow-2xs">Cả ngày (Full)</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <WheelTimePicker label="Bắt Đầu" hour={formData.gio_bat_dau_h} minute={formData.gio_bat_dau_m} minHour={0} maxHour={23} onHourChange={(h) => setFormData(prev => ({ ...prev, gio_bat_dau_h: h }))} onMinuteChange={(m) => setFormData(prev => ({ ...prev, gio_bat_dau_m: m }))} />
                                <WheelTimePicker label="Kết Thúc" hour={formData.gio_ket_thuc_h} minute={formData.gio_ket_thuc_m} minHour={1} maxHour={24} onHourChange={(h) => setFormData(prev => ({ ...prev, gio_ket_thuc_h: h }))} onMinuteChange={(m) => setFormData(prev => ({ ...prev, gio_ket_thuc_m: m }))} />
                            </div>
                            <div className="pt-3 border-t mt-3 flex items-center justify-between gap-2">
                                {regModalMode === 'edit' ? <button type="button" onClick={handleDeleteRegistration} className="px-3 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-md flex-1"><Trash2 size={15}/> Hủy Đăng Ký</button> : <button type="button" onClick={() => setIsRegModalOpen(false)} className="px-3 py-2.5 text-xs font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl cursor-pointer shadow-2xs flex-1 text-center">Hủy Bỏ</button>}
                                <button type="submit" className="px-3 py-2.5 text-xs font-bold text-white rounded-xl shadow-md flex items-center justify-center gap-1 cursor-pointer flex-1 bg-emerald-600 hover:bg-emerald-700"><Check size={15}/> Xác Nhận</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL THÊM / SỬA CA LÀM THỰC TẾ CÓ THÊM HỆ SỐ LƯƠNG */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-fade-in-up my-auto">
                        <div className={`p-3 flex justify-between items-center text-white ${modalMode === 'add' ? 'bg-[#0B1E3F]' : 'bg-amber-600'}`}>
                            <h3 className="font-bold uppercase tracking-wider text-xs">{modalMode === 'add' ? 'Thêm Ca Làm Mới' : 'Chỉnh Sửa Ca Làm'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-md cursor-pointer"><X size={16}/></button>
                        </div>
                        <form onSubmit={handleSaveShift} className="p-4 space-y-3">
                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200"><p className="text-xs font-bold text-[#0B1E3F] mb-0.5">{formData.ho_ten}</p><p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1"><Clock size={11}/> Ngày làm: {formData.ngay_lam.split('-').reverse().join('/')}</p></div>
                            <div className="grid grid-cols-2 gap-2">
                                <WheelTimePicker label="Bắt Đầu" hour={formData.gio_bat_dau_h} minute={formData.gio_bat_dau_m} minHour={0} maxHour={23} onHourChange={(h) => handleStartHourChange(h)} onMinuteChange={(m) => setFormData(prev => ({ ...prev, gio_bat_dau_m: m }))} />
                                <WheelTimePicker label="Kết Thúc" hour={formData.gio_ket_thuc_h} minute={formData.gio_ket_thuc_m} minHour={1} maxHour={24} onHourChange={(h) => setFormData(prev => ({ ...prev, gio_ket_thuc_h: h }))} onMinuteChange={(m) => setFormData(prev => ({ ...prev, gio_ket_thuc_m: m }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Chi Nhánh</label>
                                    <div className="flex gap-1">
                                        <select value={formData.id_chi_nhanh} onChange={e => setFormData({...formData, id_chi_nhanh: e.target.value})} className="flex-1 p-2 border border-gray-300 rounded-xl bg-gray-50 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none">{chiNhanhList.map(cn => (<option key={cn.id} value={cn.id}>{cn.ten_chi_nhanh}</option>))}</select>
                                        <button type="button" onClick={() => setIsBranchModalOpen(true)} className="bg-[#0B1E3F] text-[#FFD166] px-2 rounded-xl hover:bg-[#1D3557] cursor-pointer shadow-2xs flex items-center justify-center" title="Quản lý chi nhánh"><Settings size={14}/></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase text-pink-600">Hệ số Lương</label>
                                    <select value={formData.he_so_ngay_le} onChange={e => setFormData({...formData, he_so_ngay_le: e.target.value})} className="w-full p-2 border border-pink-300 rounded-xl bg-pink-50 text-pink-700 text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none">
                                        <option value={1}>x1 (Thường)</option>
                                        <option value={1.5}>x1.5 (Tăng ca)</option>
                                        <option value={2}>x2 (Ngày lễ)</option>
                                        <option value={3}>x3 (Ngày lễ)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-3 border-t mt-3 flex items-center justify-between gap-2">
                                {modalMode === 'edit' ? <button type="button" onClick={handleDeleteShift} className="px-3 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-md flex-1"><Trash2 size={15}/> Xóa Ca</button> : <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-2.5 text-xs font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl cursor-pointer shadow-2xs flex-1 text-center">Hủy Bỏ</button>}
                                <button type="submit" className={`px-3 py-2.5 text-xs font-bold text-white rounded-xl shadow-md flex items-center justify-center gap-1 cursor-pointer flex-1 ${modalMode === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600 text-[#0B1E3F]'}`}>{modalMode === 'add' ? <><Check size={15}/> Lưu Lịch</> : <><Edit size={15}/> Cập Nhật</>}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL QUẢN LÝ CHI NHÁNH */}
            {isBranchModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up my-auto">
                        <div className="p-3 bg-[#0B1E3F] text-white flex justify-between items-center"><h3 className="font-bold uppercase tracking-wider text-xs flex items-center gap-1.5"><Settings size={16} className="text-[#FFD166]"/> Quản Lý Chi Nhánh</h3><button onClick={() => setIsBranchModalOpen(false)} className="hover:bg-white/20 p-1 rounded-md cursor-pointer"><X size={16}/></button></div>
                        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
                            <form onSubmit={handleSaveBranch} className="space-y-2.5 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <h4 className="text-[11px] font-extrabold text-[#0B1E3F] uppercase">{isEditingBranch ? 'Sửa thông tin chi nhánh' : 'Thêm chi nhánh mới'}</h4>
                                <div><label className="block text-[10px] font-bold text-gray-700 mb-0.5 uppercase">Tên chi nhánh</label><input type="text" required value={branchForm.ten_chi_nhanh} onChange={e => setBranchForm({...branchForm, ten_chi_nhanh: e.target.value})} className="w-full p-2 border border-gray-300 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500" /></div>
                                <div className="grid grid-cols-2 gap-2"><div><label className="block text-[9px] font-bold text-gray-700 mb-0.5 uppercase">Lương cơ bản / giờ</label><input type="number" step="1000" required value={branchForm.luong_co_ban_mot_gio} onChange={e => setBranchForm({...branchForm, luong_co_ban_mot_gio: e.target.value})} className="w-full p-2 border border-gray-300 rounded-xl text-xs font-bold bg-white outline-none" /></div><div><label className="block text-[9px] font-bold text-gray-700 mb-0.5 uppercase">Phụ cấp theo giờ</label><input type="number" step="500" value={branchForm.phu_cap_theo_gio} onChange={e => setBranchForm({...branchForm, phu_cap_theo_gio: e.target.value})} className="w-full p-2 border border-gray-300 rounded-xl text-xs font-bold bg-white outline-none" /></div></div>
                                <div className="flex gap-1.5 pt-1">{isEditingBranch && (<button type="button" onClick={() => { setIsEditingBranch(false); setBranchForm({ id: '', ten_chi_nhanh: '', luong_co_ban_mot_gio: 25000, phu_cap_theo_gio: 0, phu_cap_co_dinh: 0, khau_tru_theo_gio: 0, ly_do_khau_tru: '' }); }} className="px-3 py-2 text-[11px] font-bold bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl cursor-pointer">Hủy</button>)}<button type="submit" className={`flex-1 py-2 px-3 text-[11px] font-bold rounded-xl shadow-xs cursor-pointer text-white ${isEditingBranch ? 'bg-amber-500 hover:bg-amber-600 text-[#0B1E3F]' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{isEditingBranch ? 'Cập nhật' : 'Thêm chi nhánh'}</button></div>
                            </form>
                            <div className="space-y-2">
                                <h4 className="text-[11px] font-extrabold text-[#0B1E3F] uppercase">Danh sách chi nhánh</h4>
                                <div className="space-y-2">{chiNhanhList.map(cn => (<div key={cn.id} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl shadow-2xs"><div><span className="text-xs font-bold text-gray-900 block">{cn.ten_chi_nhanh}</span><span className="text-[10px] text-gray-500">Lương: {Number(cn.luong_co_ban_mot_gio).toLocaleString()}đ/h</span></div><div className="flex items-center gap-1.5"><button type="button" onClick={() => { setIsEditingBranch(true); setBranchForm(cn); }} className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[10px] font-bold cursor-pointer shadow-2xs">Sửa</button><button type="button" onClick={() => handleDeleteBranch(cn.id)} className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[10px] font-bold cursor-pointer shadow-2xs">Xóa</button></div></div>))}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}