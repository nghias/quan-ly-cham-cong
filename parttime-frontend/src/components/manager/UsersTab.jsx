import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Plus, Edit, Key, Lock, Unlock, X, Save } from 'lucide-react';

export default function UsersTab() {
    const [nhanVien, setNhanVien] = useState([]);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [formData, setFormData] = useState({
        id: '',
        ho_ten: '',
        ma_nhan_vien: '',
        so_dien_thoai: '',
        vai_tro: 'NHAN_VIEN',
        mat_khau: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axiosClient.get('/users');
            setNhanVien(res.data);
        } catch (err) {
            console.error("Lỗi lấy danh sách nhân sự", err);
        }
    };

    // --- MỞ MODAL THÊM MỚI ---
    const handleOpenAdd = () => {
        setModalMode('add');
        setFormData({
            id: '',
            ho_ten: '',
            ma_nhan_vien: '',
            so_dien_thoai: '',
            vai_tro: 'NHAN_VIEN',
            mat_khau: ''
        });
        setIsModalOpen(true);
    };

    // --- MỞ MODAL SỬA ---
    const handleOpenEdit = (nv) => {
        setModalMode('edit');
        setFormData({
            id: nv.id,
            ho_ten: nv.ho_ten,
            ma_nhan_vien: nv.ma_nhan_vien,
            so_dien_thoai: nv.so_dien_thoai || '',
            vai_tro: nv.vai_tro,
            mat_khau: '' // Sửa không cần nhập lại mật khẩu
        });
        setIsModalOpen(true);
    };

    // --- LƯU TÀI KHOẢN (THÊM / SỬA) ---
    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'add') {
                await axiosClient.post('/users', formData);
                alert("Tạo tài khoản thành công!");
            } else {
                await axiosClient.put(`/users/${formData.id}`, {
                    ho_ten: formData.ho_ten,
                    so_dien_thoai: formData.so_dien_thoai,
                    vai_tro: formData.vai_tro
                });
                alert("Cập nhật thông tin thành công!");
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            alert(`Lỗi: ${err.response?.data?.error || err.message}`);
        }
    };

    // --- RESET MẬT KHẨU BẰNG MÃ NHÂN VIÊN ---
    const handleResetPassword = async (nv) => {
        if(!window.confirm(`Xác nhận đặt lại mật khẩu cho ${nv.ho_ten} thành mã nhân viên (${nv.ma_nhan_vien})?`)) return;
        try {
            // Truyền trực tiếp mã nhân viên làm mật khẩu mới xuống backend
            await axiosClient.post(`/users/${nv.id}/reset-password`, {
                mat_khau_moi: nv.ma_nhan_vien
            });
            alert(`Thành công! Mật khẩu mới của ${nv.ho_ten} đã được đổi thành: ${nv.ma_nhan_vien}`);
        } catch (err) {
            alert("Có lỗi xảy ra khi reset mật khẩu!");
        }
    };

    // --- KHÓA / MỞ KHÓA TÀI KHOẢN ---
    const handleToggleStatus = async (nv) => {
        const isCurrentlyActive = nv.trang_thai_hoat_dong !== 0; // 1 là hoạt động, 0 là khóa
        const actionText = isCurrentlyActive ? "khóa" : "mở khóa";
        
        if(!window.confirm(`Xác nhận ${actionText} tài khoản của ${nv.ho_ten}?`)) return;
        try {
            // Truyền trạng thái đảo ngược xuống Backend (Nếu đang 1 thì gửi 0, đang 0 thì gửi 1)
            await axiosClient.put(`/users/${nv.id}/disable`, {
                trang_thai_hoat_dong: isCurrentlyActive ? 0 : 1
            });
            fetchUsers(); // Tải lại danh sách để cập nhật trạng thái
        } catch (err) {
            alert(`Lỗi khi ${actionText} tài khoản!`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-[#0B1E3F] text-white border-b flex justify-between items-center">
                    <h2 className="text-sm font-extrabold uppercase tracking-wide">Danh Sách Nhân Viên</h2>
                    <button 
                        onClick={handleOpenAdd} 
                        className="bg-[#FFD166] text-[#0B1E3F] px-4 py-2 rounded-lg text-xs font-black shadow-md hover:bg-yellow-400 transition flex items-center gap-1"
                    >
                        <Plus size={16} strokeWidth={3}/> Thêm Mới
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-[#0B1E3F] text-xs uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-4 py-3 whitespace-nowrap">Họ Tên</th>
                                <th className="px-4 py-3">Mã NV</th>
                                <th className="px-4 py-3 text-center">Vai Trò</th>
                                <th className="px-4 py-3 text-center">Trạng Thái</th>
                                <th className="px-4 py-3 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {nhanVien.map(nv => {
                                const isActive = nv.trang_thai_hoat_dong !== 0;
                                return (
                                    <tr key={nv.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 font-bold text-gray-800 whitespace-nowrap">{nv.ho_ten}</td>
                                        <td className="px-4 py-3 font-medium text-gray-600">{nv.ma_nhan_vien}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                                nv.vai_tro === 'QUAN_LY' ? 'bg-amber-100 text-amber-700' : 
                                                nv.vai_tro === 'KY_THUAT' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {nv.vai_tro === 'QUAN_LY' ? 'Quản lý' : nv.vai_tro === 'KY_THUAT' ? 'Kỹ Thuật' : 'Nhân viên'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                                isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {isActive ? 'Hoạt động' : 'Đã khóa'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 flex gap-1.5 justify-center">
                                            {/* Nút Sửa */}
                                            <button 
                                                onClick={() => handleOpenEdit(nv)} 
                                                className="bg-blue-50 text-blue-600 p-1.5 rounded-lg hover:bg-blue-100 transition shadow-sm"
                                                title="Sửa thông tin"
                                            >
                                                <Edit size={16}/>
                                            </button>

                                            {/* Nút Reset Mật Khẩu */}
                                            <button 
                                                onClick={() => handleResetPassword(nv)} 
                                                className="bg-amber-50 text-amber-600 p-1.5 rounded-lg hover:bg-amber-100 transition shadow-sm"
                                                title="Cấp lại mật khẩu bằng Mã nhân viên"
                                            >
                                                <Key size={16}/>
                                            </button>

                                            {/* Nút Khóa / Mở Khóa */}
                                            <button 
                                                onClick={() => handleToggleStatus(nv)} 
                                                className={`p-1.5 rounded-lg transition shadow-sm ${
                                                    isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                }`}
                                                title={isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                            >
                                                {isActive ? <Lock size={16}/> : <Unlock size={16}/>}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {nhanVien.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400 font-medium">Đang tải dữ liệu...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL THÊM / SỬA TÀI KHOẢN */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up my-auto">
                        <div className="p-4 bg-[#0B1E3F] text-white flex justify-between items-center">
                            <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                {modalMode === 'add' ? <Plus size={18} className="text-[#FFD166]"/> : <Edit size={18} className="text-[#FFD166]"/>}
                                {modalMode === 'add' ? 'Tạo Tài Khoản Mới' : 'Sửa Thông Tin Tài Khoản'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-md transition"><X size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleSaveUser} className="p-5 space-y-4 bg-gray-50">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">Họ và tên</label>
                                <input 
                                    type="text" required
                                    value={formData.ho_ten}
                                    onChange={e => setFormData({...formData, ho_ten: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">Mã NV (Tên đăng nhập)</label>
                                    <input 
                                        type="text" required
                                        disabled={modalMode === 'edit'} // Không cho sửa mã NV nếu đang edit
                                        value={formData.ma_nhan_vien}
                                        onChange={e => setFormData({...formData, ma_nhan_vien: e.target.value})}
                                        className={`w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 ${modalMode === 'edit' ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">Số điện thoại</label>
                                    <input 
                                        type="text"
                                        value={formData.so_dien_thoai}
                                        onChange={e => setFormData({...formData, so_dien_thoai: e.target.value})}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">Vai trò</label>
                                <select 
                                    value={formData.vai_tro} 
                                    onChange={e => setFormData({...formData, vai_tro: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="NHAN_VIEN">Nhân viên</option>
                                    <option value="QUAN_LY">Quản lý</option>
                                    <option value="KY_THUAT">Kỹ thuật</option>
                                </select>
                            </div>

                            {/* Chỉ hiển thị nhập mật khẩu khi tạo mới */}
                            {modalMode === 'add' && (
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">Mật khẩu khởi tạo</label>
                                    <input 
                                        type="text" required
                                        value={formData.mat_khau}
                                        onChange={e => setFormData({...formData, mat_khau: e.target.value})}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            )}

                            <div className="pt-3 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="flex-1 py-3 text-sm font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition shadow-sm text-center"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                                >
                                    <Save size={18}/> {modalMode === 'add' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}