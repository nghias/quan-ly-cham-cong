import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { User, X, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
    const [profileForm, setProfileForm] = useState({ id: '', ho_ten: '', so_dien_thoai: '', ma_nhan_vien: '', vai_tro: '' });
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100vh';
            
            // Gọi API lấy dữ liệu mỗi khi mở Modal
            setProfileError(''); setProfileSuccess('');
            axiosClient.get('/me').then(res => {
                setProfileForm({
                    id: res.data.id,
                    ho_ten: res.data.ho_ten || '',
                    so_dien_thoai: res.data.so_dien_thoai || '',
                    ma_nhan_vien: res.data.ma_nhan_vien || '',
                    vai_tro: res.data.vai_tro || ''
                });
            }).catch(() => setProfileError("Lỗi khi tải thông tin tài khoản"));
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.height = 'auto';
        }
        return () => { document.body.style.overflow = 'unset'; document.body.style.height = 'auto'; };
    }, [isOpen]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileError(''); setProfileSuccess('');
        try {
            await axiosClient.put(`/users/${profileForm.id}`, {
                ho_ten: profileForm.ho_ten,
                so_dien_thoai: profileForm.so_dien_thoai,
                vai_tro: profileForm.vai_tro 
            });
            setProfileSuccess("Cập nhật thông tin thành công!");
            localStorage.setItem('ho_ten', profileForm.ho_ten); 
            setTimeout(() => {
                onClose();
                window.location.reload(); 
            }, 1000);
        } catch (error) {
            setProfileError(error.response?.data?.error || "Cập nhật thất bại. Vui lòng thử lại!");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-screen bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                <div className="p-4 bg-[#0B1E3F] text-white flex justify-between items-center">
                    <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                        <User size={18} className="text-[#FFD166]"/> Thông tin tài khoản
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-md transition cursor-pointer"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="p-5 space-y-4 bg-gray-50">
                    {profileError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                            <AlertTriangle size={16} className="shrink-0" /> <span>{profileError}</span>
                        </div>
                    )}
                    {profileSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 size={16} className="shrink-0" /> <span>{profileSuccess}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mã nhân viên (Chỉ xem)</label>
                        <input type="text" value={profileForm.ma_nhan_vien} disabled className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold bg-gray-100 text-gray-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Họ và tên</label>
                        <input type="text" required value={profileForm.ho_ten} onChange={e => setProfileForm({...profileForm, ho_ten: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Số điện thoại</label>
                        <input type="text" value={profileForm.so_dien_thoai} onChange={e => setProfileForm({...profileForm, so_dien_thoai: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                    
                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition cursor-pointer">Đóng</button>
                        <button type="submit" disabled={!!profileSuccess} className="flex-1 py-3 text-sm font-bold text-[#0B1E3F] bg-[#FFD166] hover:bg-yellow-400 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"><Save size={18}/> Cập nhật</button>
                    </div>
                </form>
            </div>
        </div>
    );
}