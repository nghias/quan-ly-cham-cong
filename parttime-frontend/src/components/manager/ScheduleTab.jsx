import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../../api/axiosClient';
import { X, Save, Trash2, Clock, Plus, Settings, Edit, Check } from 'lucide-react';

// Component con lăn chọn giờ/phút (Đã fix lỗi passive event listener)
function WheelTimePicker({ hour, minute, onHourChange, onMinuteChange, label, minHour = 0, maxHour = 23 }) {
    const [isEditingH, setIsEditingH] = useState(false);
    const [tempH, setTempH] = useState(String(hour).padStart(2, '0'));
    const [isEditingM, setIsEditingM] = useState(false);
    const [tempM, setTempM] = useState(String(minute).padStart(2, '0'));

    const hourContainerRef = useRef(null);
    const minuteContainerRef = useRef(null);

    const hourRef = useRef(hour);
    hourRef.current = hour;
    const minuteRef = useRef(minute);
    minuteRef.current = minute;

    useEffect(() => {
        setTempH(String(hour).padStart(2, '0'));
    }, [hour]);

    useEffect(() => {
        setTempM(String(minute).padStart(2, '0'));
    }, [minute]);

    // Gắn sự kiện native wheel với { passive: false } để ngăn cuộn trang phía sau
    useEffect(() => {
        const hourEl = hourContainerRef.current;
        const minuteEl = minuteContainerRef.current;

        const handleHourWheel = (e) => {
            e.preventDefault();
            let nextH = e.deltaY > 0 ? hourRef.current - 1 : hourRef.current + 1;
            if (nextH < minHour) nextH = maxHour;
            if (nextH > maxHour) nextH = minHour;
            onHourChange(nextH);
        };

        const handleMinuteWheel = (e) => {
            e.preventDefault();
            let nextM = e.deltaY > 0 ? minuteRef.current - 15 : minuteRef.current + 15;
            if (nextM < 0) nextM = 45;
            if (nextM > 59) nextM = 0;
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
        if (num < minHour) num = minHour;
        if (num > maxHour) num = maxHour;
        onHourChange(num);
    };

    const handleBlurM = () => {
        setIsEditingM(false);
        let num = parseInt(tempM, 10);
        if (isNaN(num)) num = minute;
        if (num < 0) num = 0;
        if (num > 59) num = 59;
        onMinuteChange(num);
    };

    const prevH = hour - 1 < minHour ? maxHour : hour - 1;
    const nextH = hour + 1 > maxHour ? minHour : hour + 1;
    const prevM = minute - 15 < 0 ? 45 : minute - 15;
    const nextM = minute + 15 > 59 ? 0 : minute + 15;

    return (
        <div className="space-y-1.5">
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase text-center">{label}</label>
            <div className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-3 shadow-inner">
                
                {/* WHEEL GIỜ */}
                <div ref={hourContainerRef} className="flex flex-col items-center justify-center select-none cursor-ns-resize py-1 px-2">
                    <div onClick={() => onHourChange(prevH)} className="text-gray-300 text-sm font-semibold transition hover:text-gray-500 py-0.5 select-none cursor-pointer">
                        {String(prevH).padStart(2, '0')}
                    </div>
                    <div className="py-1">
                        {isEditingH ? (
                            <input 
                                type="number"
                                autoFocus
                                value={tempH}
                                onChange={(e) => setTempH(e.target.value)}
                                onBlur={handleBlurH}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleBlurH(); }}
                                className="w-12 bg-white border-2 border-blue-500 rounded-lg text-lg font-black text-[#0B1E3F] text-center outline-none"
                            />
                        ) : (
                            <div 
                                onClick={() => setIsEditingH(true)}
                                className="text-2xl font-black text-[#0B1E3F] tracking-wider bg-white px-2.5 py-0.5 rounded-xl border border-gray-200 shadow-xs hover:border-blue-400 transition cursor-pointer"
                            >
                                {String(hour).padStart(2, '0')}
                            </div>
                        )}
                    </div>
                    <div onClick={() => onHourChange(nextH)} className="text-gray-300 text-sm font-semibold transition hover:text-gray-500 py-0.5 select-none cursor-pointer">
                        {String(nextH).padStart(2, '0')}
                    </div>
                </div>

                <span className="font-black text-gray-400 text-xl pb-1">:</span>

                {/* WHEEL PHÚT */}
                <div ref={minuteContainerRef} className="flex flex-col items-center justify-center select-none cursor-ns-resize py-1 px-2">
                    <div onClick={() => onMinuteChange(prevM)} className="text-gray-300 text-sm font-semibold transition hover:text-gray-500 py-0.5 select-none cursor-pointer">
                        {String(prevM).padStart(2, '0')}
                    </div>
                    <div className="py-1">
                        {isEditingM ? (
                            <input 
                                type="number"
                                autoFocus
                                value={tempM}
                                onChange={(e) => setTempM(e.target.value)}
                                onBlur={handleBlurM}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleBlurM(); }}
                                className="w-12 bg-white border-2 border-blue-500 rounded-lg text-lg font-black text-[#0B1E3F] text-center outline-none"
                            />
                        ) : (
                            <div 
                                onClick={() => setIsEditingM(true)}
                                className="text-2xl font-black text-[#0B1E3F] tracking-wider bg-white px-2.5 py-0.5 rounded-xl border border-gray-200 shadow-xs hover:border-blue-400 transition cursor-pointer"
                            >
                                {String(minute).padStart(2, '0')}
                            </div>
                        )}
                    </div>
                    <div onClick={() => onMinuteChange(nextM)} className="text-gray-300 text-sm font-semibold transition hover:text-gray-500 py-0.5 select-none cursor-pointer">
                        {String(nextM).padStart(2, '0')}
                    </div>
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

    const userRole = (localStorage.getItem('vai_tro') || '').trim().toUpperCase();
    const isManager = userRole === 'QUAN_LY' || userRole === 'QUẢN LÝ' || userRole === 'ADMIN' || userRole === 'MANAGER';

    // Trạng thái Modal Xếp Lịch Làm Thực Tế (Mục 2)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedShiftId, setSelectedShiftId] = useState(null);

    // Trạng thái Modal Đăng Ký Nguyện Vọng (Mục 1)
    const [isRegModalOpen, setIsRegModalOpen] = useState(false);
    const [regModalMode, setRegModalMode] = useState('add');
    const [selectedRegId, setSelectedRegId] = useState(null);

    // Trạng thái Modal Quản Lý Chi Nhánh
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [branchForm, setBranchForm] = useState({ 
        id: '', 
        ten_chi_nhanh: '', 
        luong_co_ban_mot_gio: 25000, 
        phu_cap_theo_gio: 0, 
        phu_cap_co_dinh: 0, 
        khau_tru_theo_gio: 0, 
        ly_do_khau_tru: '' 
    });
    const [isEditingBranch, setIsEditingBranch] = useState(false);

    const [formData, setFormData] = useState({
        id_nguoi_dung: '',
        ho_ten: '',
        ngay_lam: '',
        gio_bat_dau_h: 8,
        gio_bat_dau_m: 0,
        gio_ket_thuc_h: 12,
        gio_ket_thuc_m: 0,
        id_chi_nhanh: '1'
    });

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

    useEffect(() => {
        fetchEmployees();
        fetchBranches();
        fetchRegistrations(week.start, week.end);
        fetchShifts(week.start, week.end);
    }, [week]);

    const fetchBranches = async () => {
        try {
            const res = await axiosClient.get('/branches');
            setChiNhanhList(res.data);
            if (res.data.length > 0 && !formData.id_chi_nhanh) {
                setFormData(prev => ({ ...prev, id_chi_nhanh: res.data[0].id.toString() }));
            }
        } catch (err) {
            console.error("Lỗi tải chi nhánh", err);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axiosClient.get('/users');
            setNhanVienList(res.data);
        } catch (err) {
            console.error("Lỗi tải nhân sự", err);
        }
    };

    const fetchRegistrations = async (start, end) => {
        try {
            const res = await axiosClient.get('/shifts/registrations', { params: { startDate: start, endDate: end } });
            const grouped = {};
            res.data.forEach(curr => {
                if (!grouped[curr.id_nguoi_dung]) grouped[curr.id_nguoi_dung] = { raw: {}, data: {} };
                const dayOfWeek = new Date(curr.ngay_dang_ky).getDay();
                const dayKey = dayOfWeek === 0 ? 'cn' : `t${dayOfWeek + 1}`;
                
                const dStart = new Date(`1970-01-01T${curr.gio_bat_dau}`);
                const dEnd = new Date(`1970-01-01T${curr.gio_ket_thuc}`);
                const sH = dStart.getHours();
                const sM = dStart.getMinutes();
                const eH = dEnd.getHours();
                const eM = dEnd.getMinutes();

                const sStr = sM > 0 ? `${sH}h${String(sM).padStart(2, '0')}` : `${sH}h`;
                const eStr = eM > 0 ? `${eH}h${String(eM).padStart(2, '0')}` : `${eH}h`;
                
                grouped[curr.id_nguoi_dung].raw[dayKey] = curr;
                grouped[curr.id_nguoi_dung].data[dayKey] = (sH === 8 && eH >= 22) ? 'Full' : `${sStr}-${eStr}`;
            });
            setDangKyCa(grouped);
        } catch (err) {
            console.error("Lỗi lấy đăng ký", err);
        }
    };

    const fetchShifts = async (start, end) => {
        try {
            const res = await axiosClient.get('/shifts', { params: { startDate: `${start} 00:00:00`, endDate: `${end} 23:59:59` } });
            setLichLam(res.data);
        } catch (err) {
            console.error("Lỗi lấy lịch làm", err);
        }
    };

    // --- XỬ LÝ SỰ KIỆN MỤC 1: ĐĂNG KÝ NGUYỆN VỌNG ---
    const handleCellClickRegistration = (nhanVien, dateKey, existingReg) => {
        if (existingReg) {
            setRegModalMode('edit');
            setSelectedRegId(existingReg.id);
            const dStart = new Date(`${existingReg.ngay_dang_ky.split('T')[0]} ${existingReg.gio_bat_dau}`);
            const dEnd = new Date(`${existingReg.ngay_dang_ky.split('T')[0]} ${existingReg.gio_ket_thuc}`);
            setFormData({
                id_nguoi_dung: nhanVien.id,
                ho_ten: nhanVien.ho_ten,
                ngay_lam: dateKey,
                gio_bat_dau_h: isNaN(dStart.getHours()) ? 8 : dStart.getHours(),
                gio_bat_dau_m: isNaN(dStart.getMinutes()) ? 0 : dStart.getMinutes(),
                gio_ket_thuc_h: isNaN(dEnd.getHours()) ? 22 : dEnd.getHours(),
                gio_ket_thuc_m: isNaN(dEnd.getMinutes()) ? 0 : dEnd.getMinutes(),
                id_chi_nhanh: formData.id_chi_nhanh
            });
        } else {
            setRegModalMode('add');
            setSelectedRegId(null);
            setFormData({
                id_nguoi_dung: nhanVien.id,
                ho_ten: nhanVien.ho_ten,
                ngay_lam: dateKey,
                gio_bat_dau_h: 8,
                gio_bat_dau_m: 0,
                gio_ket_thuc_h: 22,
                gio_ket_thuc_m: 0,
                id_chi_nhanh: formData.id_chi_nhanh
            });
        }
        setIsRegModalOpen(true);
    };

    const handleSelectFullDayRegistration = () => {
        setFormData(prev => ({
            ...prev,
            gio_bat_dau_h: 8,
            gio_bat_dau_m: 0,
            gio_ket_thuc_h: 22,
            gio_ket_thuc_m: 0
        }));
    };

    const handleSaveRegistration = async (e) => {
        e.preventDefault();
        const sH = Number(formData.gio_bat_dau_h);
        const sM = Number(formData.gio_bat_dau_m);
        const eH = Number(formData.gio_ket_thuc_h);
        const eM = Number(formData.gio_ket_thuc_m);

        if ((eH * 60 + eM) <= (sH * 60 + sM) || (eH * 60 + eM) > 24 * 60) {
            alert("Lỗi: Thời gian kết thúc phải lớn hơn bắt đầu và không quá 24h00!");
            return;
        }

        const gio_bat_dau = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}:00`;
        const gio_ket_thuc = `${eH === 24 ? '23:59' : String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}:00`;

        try {
            if (regModalMode === 'add') {
                const payload = {
                    id_nguoi_dung: formData.id_nguoi_dung,
                    ngay_dang_ky: formData.ngay_lam,
                    gio_bat_dau, 
                    gio_ket_thuc
                };
                await axiosClient.post('/shifts/registrations', payload);
            } else {
                const payload = {
                    id_nguoi_dung: formData.id_nguoi_dung,
                    gio_bat_dau, 
                    gio_ket_thuc
                };
                await axiosClient.put(`/shifts/registrations/${selectedRegId}`, payload);
            }
            
            setIsRegModalOpen(false);
            setSelectedRegId(null);
            fetchRegistrations(week.start, week.end);
        } catch (err) {
            alert("Lỗi khi lưu đăng ký ca!");
        }
    };

    const handleDeleteRegistration = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đăng ký này?")) return;
        try {
            await axiosClient.delete(`/shifts/registrations/${selectedRegId}`);
            setIsRegModalOpen(false);
            setSelectedRegId(null);
            fetchRegistrations(week.start, week.end);
        } catch (err) {
            alert("Lỗi khi hủy đăng ký!");
        }
    };

    // --- XỬ LÝ SỰ KIỆN MỤC 2: LỊCH LÀM VIỆC THỰC TẾ ---
    const handleOpenAdd = (nhanVien, dateKey) => {
        if (!isManager) {
            alert("Chỉ có quản lý mới được phép xếp lịch làm việc thực tế!");
            return;
        }
        setModalMode('add');
        setFormData({
            id_nguoi_dung: nhanVien.id,
            ho_ten: nhanVien.ho_ten,
            ngay_lam: dateKey,
            gio_bat_dau_h: 8,
            gio_bat_dau_m: 0,
            gio_ket_thuc_h: 12,
            gio_ket_thuc_m: 0,
            id_chi_nhanh: chiNhanhList.length > 0 ? chiNhanhList[0].id.toString() : '1'
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (e, nhanVien, dateKey, shift) => {
        e.stopPropagation(); 
        if (!isManager) {
            alert("Chỉ có quản lý mới được phép chỉnh sửa lịch làm việc thực tế!");
            return;
        }
        setModalMode('edit');
        setSelectedShiftId(shift.id);
        const dStart = new Date(shift.thoi_gian_bat_dau);
        const dEnd = new Date(shift.thoi_gian_ket_thuc);

        setFormData({
            id_nguoi_dung: nhanVien.id,
            ho_ten: nhanVien.ho_ten,
            ngay_lam: dateKey,
            gio_bat_dau_h: dStart.getHours(),
            gio_bat_dau_m: dStart.getMinutes(),
            gio_ket_thuc_h: dEnd.getHours(),
            gio_ket_thuc_m: dEnd.getMinutes(),
            id_chi_nhanh: shift.id_chi_nhanh.toString()
        });
        setIsModalOpen(true);
    };

    const handleStartHourChange = (newH) => {
        const h = Math.max(0, Math.min(23, Number(newH) || 0));
        let suggestedEndH = h + 4;
        if (suggestedEndH > 24) suggestedEndH = 24;

        setFormData(prev => ({
            ...prev,
            gio_bat_dau_h: h,
            gio_ket_thuc_h: suggestedEndH
        }));
    };

    const handleSaveShift = async (e) => {
        e.preventDefault();
        const sH = Number(formData.gio_bat_dau_h);
        const sM = Number(formData.gio_bat_dau_m);
        const eH = Number(formData.gio_ket_thuc_h);
        const eM = Number(formData.gio_ket_thuc_m);

        if ((eH * 60 + eM) <= (sH * 60 + sM) || (eH * 60 + eM) > 24 * 60) {
            alert("Lỗi: Thời gian kết thúc phải lớn hơn bắt đầu và không quá 24h00!");
            return;
        }

        const sHStr = String(sH).padStart(2, '0');
        const sMStr = String(sM).padStart(2, '0');

        let finalEndH = eH;
        let endDateStr = formData.ngay_lam;
        if (finalEndH === 24) {
            finalEndH = 0;
            const d = new Date(formData.ngay_lam);
            d.setDate(d.getDate() + 1);
            endDateStr = formatDateKey(d);
        }

        const eHStr = String(finalEndH).padStart(2, '0');
        const eMStr = String(eM).padStart(2, '0');

        const thoi_gian_bat_dau = `${formData.ngay_lam} ${sHStr}:${sMStr}:00`;
        const thoi_gian_ket_thuc = `${endDateStr} ${eHStr}:${eMStr}:00`;

        try {
            if (modalMode === 'add') {
                await axiosClient.post('/shifts/schedule', {
                    id_nguoi_dung: formData.id_nguoi_dung,
                    id_chi_nhanh: formData.id_chi_nhanh,
                    thoi_gian_bat_dau, thoi_gian_ket_thuc
                });
            } else {
                await axiosClient.put(`/shifts/update/${selectedShiftId}`, {
                    id_chi_nhanh: formData.id_chi_nhanh,
                    thoi_gian_bat_dau, thoi_gian_ket_thuc
                });
            }
            setIsModalOpen(false);
            fetchShifts(week.start, week.end);
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message;
            alert(`Lỗi: ${errorMsg}`);
        }
    };

    const handleDeleteShift = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa ca làm này?")) return;
        try {
            await axiosClient.delete(`/shifts/delete/${selectedShiftId}`);
            setIsModalOpen(false);
            fetchShifts(week.start, week.end);
        } catch (err) {
            alert("Lỗi khi xóa ca làm!");
        }
    };

    // --- QUẢN LÝ CHI NHÁNH ---
    const handleSaveBranch = async (e) => {
        e.preventDefault();
        try {
            if (isEditingBranch) {
                await axiosClient.put(`/branches/${branchForm.id}`, branchForm);
                alert("Cập nhật chi nhánh thành công!");
            } else {
                await axiosClient.post('/branches', branchForm);
                alert("Thêm chi nhánh thành công!");
            }
            fetchBranches();
            setBranchForm({ id: '', ten_chi_nhanh: '', luong_co_ban_mot_gio: 25000, phu_cap_theo_gio: 0, phu_cap_co_dinh: 0, khau_tru_theo_gio: 0, ly_do_khau_tru: '' });
            setIsEditingBranch(false);
        } catch (err) {
            alert("Lỗi lưu chi nhánh!");
        }
    };

    const handleDeleteBranch = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa chi nhánh này?")) return;
        try {
            await axiosClient.delete(`/branches/${id}`);
            fetchBranches();
        } catch (err) {
            alert("Không thể xóa chi nhánh đang có dữ liệu liên quan!");
        }
    };

    const shiftsByUserIdAndDate = lichLam.reduce((acc, ca) => {
        if (!acc[ca.id_nguoi_dung]) acc[ca.id_nguoi_dung] = {};
        const dateKey = formatDateKey(new Date(ca.thoi_gian_bat_dau));
        if (!acc[ca.id_nguoi_dung][dateKey]) acc[ca.id_nguoi_dung][dateKey] = [];
        acc[ca.id_nguoi_dung][dateKey].push(ca);
        return acc;
    }, {});

    // Lọc bỏ Ngọc và Hiền khỏi Bảng Đăng Ký Lịch Làm (Mục 1)
    const nhanVienDangKyList = nhanVienList.filter(nv => {
        const name = (nv.ho_ten || '').toLowerCase();
        return !name.includes('ngọc') && !name.includes('hiền');
    });

    return (
        <div className="space-y-6">
            
            {/* 1. BẢNG ĐĂNG KÝ NGUYỆN VỌNG (ĐÃ ẨN NGỌC VÀ HIỀN) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-2">
                    <h2 className="text-sm font-extrabold text-[#0B1E3F] uppercase">1. Đăng Ký Lịch Làm Việc Tuần Này</h2>
                    <span className="text-[11px] text-gray-500 font-medium italic">
                        * Nhấp vào ô trống để đăng ký mới, nhấp vào ô đã có lịch để sửa hoặc hủy
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-center border-collapse min-w-[750px]">
                        <thead className="bg-[#0B1E3F] text-white uppercase">
                            <tr>
                                <th className="p-2.5 sm:p-3 border-r border-[#1D3557] text-left sticky left-0 bg-[#0B1E3F] z-10 w-32 sm:w-48 align-middle">HỌ VÀ TÊN</th>
                                {weekDates.map((date, index) => {
                                    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                                    return (
                                        <th key={index} className={`p-2 border-[#1D3557] w-20 sm:w-24 align-middle ${index < 6 ? 'border-r' : ''}`}>
                                            <div className="font-bold text-xs sm:text-sm">{dayNames[date.getDay()]}</div>
                                            <div className="text-[9px] sm:text-[10px] text-[#FFD166] mt-0.5">{date.getDate()}/{date.getMonth() + 1}</div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {nhanVienDangKyList.map((nv) => {
                                const regObj = dangKyCa[nv.id] || { raw: {}, data: {} };

                                return (
                                    <tr key={nv.id} className="group hover:bg-slate-200/90 transition-colors">
                                        <td className="p-2.5 sm:p-3 font-bold text-[#0B1E3F] border-r border-gray-200 text-left sticky left-0 bg-white group-hover:bg-slate-200 z-10 shadow-[1px_0_0_0_#e5e7eb] truncate max-w-[120px] sm:max-w-none text-xs">
                                            {nv.ho_ten}
                                        </td>
                                        
                                        {weekDates.map((date, index) => {
                                            const dayKeys = ['cn', 't2', 't3', 't4', 't5', 't6', 't7'];
                                            const dKey = dayKeys[date.getDay()];
                                            const textVal = regObj.data[dKey];
                                            const existingReg = regObj.raw[dKey];

                                            return (
                                                <td 
                                                    key={index} 
                                                    onClick={() => handleCellClickRegistration(nv, formatDateKey(date), existingReg)}
                                                    className={`p-1.5 sm:p-2 align-middle min-h-[60px] cursor-pointer group-hover:bg-slate-200/70 transition-colors ${index < 6 ? 'border-r border-gray-200' : ''}`}
                                                    title="Nhấp để đăng ký / chỉnh sửa"
                                                >
                                                    <div className="flex flex-col gap-1 items-center justify-center">
                                                        {textVal ? (
                                                            <div className="font-bold text-[11px] sm:text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-1 mx-auto max-w-fit shadow-xs">
                                                                {textVal}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-300 text-[11px]">-</span>
                                                        )}
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

            {/* 2. BẢNG LỊCH THỰC TẾ (HIỂN THỊ ĐẦY ĐỦ GIỜ VÀ PHÚT) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-[#FFF8E7] border-b flex justify-between items-center flex-wrap gap-2">
                    <h2 className="text-sm font-extrabold text-[#0B1E3F] uppercase">2. Bảng Lịch Làm Việc Thực Tế</h2>
                    <span className="text-[11px] text-gray-500 font-medium italic">
                        {isManager ? "* Quản lý nhấp vào ô trống để thêm ca, nhấp vào ca để sửa/xóa" : "* Chỉ Quản lý mới có quyền thao tác lịch làm việc thực tế"}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-center border-collapse min-w-[750px]">
                        <thead className="bg-[#0B1E3F] text-white uppercase">
                            <tr>
                                <th className="p-2.5 sm:p-3 border-r border-[#1D3557] text-left sticky left-0 bg-[#0B1E3F] z-10 w-32 sm:w-48 align-middle">HỌ VÀ TÊN</th>
                                {weekDates.map((date, index) => {
                                    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                                    return (
                                        <th key={index} className={`p-2 border-[#1D3557] w-20 sm:w-24 align-middle ${index < 6 ? 'border-r' : ''}`}>
                                            <div className="font-bold text-xs sm:text-sm">{dayNames[date.getDay()]}</div>
                                            <div className="text-[9px] sm:text-[10px] text-[#FFD166] mt-0.5">{date.getDate()}/{date.getMonth() + 1}</div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {nhanVienList.map((nv) => (
                                <tr key={nv.id} className="group hover:bg-slate-200/90 transition-colors">
                                    <td className="p-2.5 sm:p-3 font-bold text-[#0B1E3F] border-r border-gray-200 text-left sticky left-0 bg-white group-hover:bg-slate-200/90 z-10 shadow-[1px_0_0_0_#e5e7eb] truncate max-w-[120px] sm:max-w-none text-xs">
                                        {nv.ho_ten} {nv.vai_tro === 'QUAN_LY' && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.2 rounded ml-1 font-semibold">QL</span>}
                                    </td>
                                    
                                    {weekDates.map((date, index) => {
                                        const dKey = formatDateKey(date);
                                        const shiftsOnThisDay = shiftsByUserIdAndDate[nv.id]?.[dKey] || [];
                                        
                                        return (
                                            <td 
                                                key={index} 
                                                onClick={() => isManager && handleOpenAdd(nv, dKey)}
                                                className={`p-1.5 sm:p-2 align-middle min-h-[60px] ${isManager ? 'cursor-pointer group-hover:bg-slate-200/60' : 'cursor-default'} transition-colors ${index < 6 ? 'border-r border-gray-200' : ''}`}
                                            >
                                                <div className="flex flex-col gap-1 items-center justify-center">
                                                    {shiftsOnThisDay.length > 0 ? (
                                                        <>
                                                            {shiftsOnThisDay.map((s, si) => {
                                                                const dStart = new Date(s.thoi_gian_bat_dau);
                                                                const dEnd = new Date(s.thoi_gian_ket_thuc);
                                                                const sH = dStart.getHours();
                                                                const sM = dStart.getMinutes();
                                                                const eH = dEnd.getHours();
                                                                const eM = dEnd.getMinutes();

                                                                const sStr = sM > 0 ? `${sH}h${String(sM).padStart(2, '0')}` : `${sH}h`;
                                                                const eStr = eM > 0 ? `${eH}h${String(eM).padStart(2, '0')}` : `${eH}h`;

                                                                return (
                                                                    <div 
                                                                        key={si} 
                                                                        onClick={(e) => isManager ? handleOpenEdit(e, nv, dKey, s) : e.stopPropagation()}
                                                                        className={`font-bold text-[11px] sm:text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-1 mx-auto max-w-fit shadow-xs ${isManager ? 'hover:bg-blue-100 hover:border-blue-400 cursor-pointer' : ''} transition`}
                                                                    >
                                                                        {sStr}-{eStr} 
                                                                        {s.id_chi_nhanh !== 1 && <span className="text-orange-600 ml-0.5">({s.ten_chi_nhanh})</span>}
                                                                    </div>
                                                                );
                                                            })}
                                                            {isManager && (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenAdd(nv, dKey);
                                                                    }}
                                                                    className="mt-1 bg-emerald-100 hover:bg-[#0B1E3F] hover:text-emerald-400 text-emerald-700 border border-emerald-200 hover:border-[#0B1E3F] rounded px-1.5 py-0.5 text-[10px] font-bold transition-all shadow-xs flex items-center gap-0.5"
                                                                    title="Thêm ca tiếp theo"
                                                                >
                                                                    <Plus size={10}/> Thêm ca
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-300 text-[11px]">-</span>
                                                    )}
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

            {/* MODAL THÊM / SỬA ĐĂNG KÝ NGUYỆN VỌNG */}
            {isRegModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up my-auto">
                        <div className="p-4 bg-[#0B1E3F] text-white flex justify-between items-center">
                            <h3 className="font-bold uppercase tracking-wider text-sm">
                                {regModalMode === 'add' ? 'Đăng Ký Nguyện Vọng' : 'Chỉnh Sửa Đăng Ký'}
                            </h3>
                            <button onClick={() => setIsRegModalOpen(false)} className="hover:bg-white/20 p-1 rounded-md"><X size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleSaveRegistration} className="p-5 space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-[#0B1E3F] mb-1">{formData.ho_ten}</p>
                                    <p className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Clock size={12}/> Ngày: {formData.ngay_lam.split('-').reverse().join('/')}</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleSelectFullDayRegistration}
                                    className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition shadow-xs"
                                >
                                    Cả ngày (Full)
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <WheelTimePicker 
                                    label="Bắt Đầu"
                                    hour={formData.gio_bat_dau_h}
                                    minute={formData.gio_bat_dau_m}
                                    minHour={0} maxHour={23}
                                    onHourChange={(h) => setFormData(prev => ({ ...prev, gio_bat_dau_h: h }))}
                                    onMinuteChange={(m) => setFormData(prev => ({ ...prev, gio_bat_dau_m: m }))}
                                />
                                <WheelTimePicker 
                                    label="Kết Thúc"
                                    hour={formData.gio_ket_thuc_h}
                                    minute={formData.gio_ket_thuc_m}
                                    minHour={1} maxHour={24}
                                    onHourChange={(h) => setFormData(prev => ({ ...prev, gio_ket_thuc_h: h }))}
                                    onMinuteChange={(m) => setFormData(prev => ({ ...prev, gio_ket_thuc_m: m }))}
                                />
                            </div>

                            <div className="pt-4 border-t mt-4 flex items-center justify-between gap-3">
                                {regModalMode === 'edit' ? (
                                    <button 
                                        type="button" 
                                        onClick={handleDeleteRegistration} 
                                        className="px-4 py-3 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-1.5 transition shadow-md flex-1"
                                    >
                                        <Trash2 size={18}/> Hủy Đăng Ký
                                    </button>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={() => setIsRegModalOpen(false)} 
                                        className="px-4 py-3 text-sm font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition shadow-sm flex-1 text-center"
                                    >
                                        Hủy Bỏ
                                    </button>
                                )}
                                
                                <button 
                                    type="submit" 
                                    className="px-4 py-3 text-sm font-bold text-white rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition flex-1 bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <Check size={18}/> Xác Nhận
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL THÊM / SỬA CA LÀM THỰC TẾ (MỤC 2) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up my-auto">
                        <div className={`p-4 flex justify-between items-center text-white ${modalMode === 'add' ? 'bg-[#0B1E3F]' : 'bg-amber-600'}`}>
                            <h3 className="font-bold uppercase tracking-wider text-sm">
                                {modalMode === 'add' ? 'Thêm Ca Làm Mới' : 'Chỉnh Sửa Ca Làm'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-md"><X size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleSaveShift} className="p-5 space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-sm font-bold text-[#0B1E3F] mb-1">{formData.ho_ten}</p>
                                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Clock size={12}/> Ngày làm: {formData.ngay_lam.split('-').reverse().join('/')}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <WheelTimePicker 
                                    label="Bắt Đầu"
                                    hour={formData.gio_bat_dau_h}
                                    minute={formData.gio_bat_dau_m}
                                    minHour={0} maxHour={23}
                                    onHourChange={(h) => handleStartHourChange(h)}
                                    onMinuteChange={(m) => setFormData(prev => ({ ...prev, gio_bat_dau_m: m }))}
                                />
                                <WheelTimePicker 
                                    label="Kết Thúc"
                                    hour={formData.gio_ket_thuc_h}
                                    minute={formData.gio_ket_thuc_m}
                                    minHour={1} maxHour={24}
                                    onHourChange={(h) => setFormData(prev => ({ ...prev, gio_ket_thuc_h: h }))}
                                    onMinuteChange={(m) => setFormData(prev => ({ ...prev, gio_ket_thuc_m: m }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Chi Nhánh</label>
                                <div className="flex gap-2">
                                    <select 
                                        value={formData.id_chi_nhanh} 
                                        onChange={e => setFormData({...formData, id_chi_nhanh: e.target.value})}
                                        className="flex-1 p-3 border border-gray-300 rounded-xl bg-gray-50 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {chiNhanhList.map(cn => (
                                            <option key={cn.id} value={cn.id}>{cn.ten_chi_nhanh}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button"
                                        onClick={() => setIsBranchModalOpen(true)}
                                        className="bg-[#0B1E3F] text-[#FFD166] px-3.5 rounded-xl hover:bg-[#1D3557] transition shadow-xs flex items-center justify-center"
                                        title="Quản lý chi nhánh"
                                    >
                                        <Settings size={18}/>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t mt-4 flex items-center justify-between gap-3">
                                {modalMode === 'edit' ? (
                                    <button 
                                        type="button" 
                                        onClick={handleDeleteShift} 
                                        className="px-4 py-3 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-1.5 transition shadow-md flex-1"
                                    >
                                        <Trash2 size={18}/> Xóa Ca
                                    </button>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)} 
                                        className="px-4 py-3 text-sm font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition shadow-sm flex-1 text-center"
                                    >
                                        Hủy Bỏ
                                    </button>
                                )}
                                
                                <button 
                                    type="submit" 
                                    className={`px-4 py-3 text-sm font-bold text-white rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition flex-1 ${
                                        modalMode === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600 text-[#0B1E3F]'
                                    }`}
                                >
                                    {modalMode === 'add' ? <><Check size={18}/> Lưu Lịch</> : <><Edit size={18}/> Cập Nhật</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL QUẢN LÝ CHI NHÁNH */}
            {isBranchModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up my-auto">
                        <div className="p-4 bg-[#0B1E3F] text-white flex justify-between items-center">
                            <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                <Settings size={18} className="text-[#FFD166]"/> Quản Lý Chi Nhánh
                            </h3>
                            <button onClick={() => setIsBranchModalOpen(false)} className="hover:bg-white/20 p-1 rounded-md"><X size={20}/></button>
                        </div>
                        
                        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
                            <form onSubmit={handleSaveBranch} className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                <h4 className="text-xs font-extrabold text-[#0B1E3F] uppercase">
                                    {isEditingBranch ? 'Sửa thông tin chi nhánh' : 'Thêm chi nhánh mới'}
                                </h4>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">Tên chi nhánh</label>
                                    <input 
                                        type="text" required
                                        value={branchForm.ten_chi_nhanh}
                                        onChange={e => setBranchForm({...branchForm, ten_chi_nhanh: e.target.value})}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Lương cơ bản / giờ</label>
                                        <input 
                                            type="number" step="1000" required
                                            value={branchForm.luong_co_ban_mot_gio}
                                            onChange={e => setBranchForm({...branchForm, luong_co_ban_mot_gio: e.target.value})}
                                            className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-bold bg-white outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Phụ cấp theo giờ</label>
                                        <input 
                                            type="number" step="500"
                                            value={branchForm.phu_cap_theo_gio}
                                            onChange={e => setBranchForm({...branchForm, phu_cap_theo_gio: e.target.value})}
                                            className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-bold bg-white outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {isEditingBranch && (
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setIsEditingBranch(false);
                                                setBranchForm({ id: '', ten_chi_nhanh: '', luong_co_ban_mot_gio: 25000, phu_cap_theo_gio: 0, phu_cap_co_dinh: 0, khau_tru_theo_gio: 0, ly_do_khau_tru: '' });
                                            }}
                                            className="px-4 py-3 text-xs font-bold bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition"
                                        >
                                            Hủy
                                        </button>
                                    )}
                                    <button 
                                        type="submit" 
                                        className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl shadow-md transition text-white ${
                                            isEditingBranch ? 'bg-amber-500 hover:bg-amber-600 text-[#0B1E3F]' : 'bg-emerald-600 hover:bg-emerald-700'
                                        }`}
                                    >
                                        {isEditingBranch ? 'Cập nhật chi nhánh' : 'Thêm chi nhánh'}
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-3">
                                <h4 className="text-xs font-extrabold text-[#0B1E3F] uppercase">Danh sách chi nhánh hiện tại</h4>
                                <div className="space-y-2.5">
                                    {chiNhanhList.map(cn => (
                                        <div key={cn.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-2xl shadow-xs">
                                            <div>
                                                <span className="text-xs font-bold text-gray-900 block">{cn.ten_chi_nhanh}</span>
                                                <span className="text-[10px] text-gray-500">Lương: {Number(cn.luong_co_ban_mot_gio).toLocaleString()}đ/h</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        setIsEditingBranch(true);
                                                        setBranchForm(cn);
                                                    }}
                                                    className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-bold transition shadow-xs"
                                                >
                                                    Sửa
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDeleteBranch(cn.id)}
                                                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold transition shadow-xs"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}