import React, { useState, useEffect, useContext } from 'react';
import axiosClient from '../../api/axiosClient';
import { AuthContext } from '../../context/AuthContext';
import { Key, X, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function PasswordModal({ isOpen, onClose }) {
    const { logout } = useContext(AuthContext);
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100vh';
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordError(''); setPasswordSuccess('');
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.height = 'auto';
        }
        return () => { document.body.style.overflow = 'unset'; document.body.style.height = 'auto'; };
    }, [isOpen]);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError(''); setPasswordSuccess('');

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError("Mật khẩu xác nhận không khớp!");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự!");
            return;
        }

        try {
            await axiosClient.put('/change-password', {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            });
            setPasswordSuccess("Đổi mật khẩu thành công! Đang đăng xuất...");
            setTimeout(() => {
                onClose();
                logout(); 
            }, 1500);
        } catch (error) {
            setPasswordError(error.response?.data?.error || "Đổi mật khẩu thất bại. Mật khẩu cũ không chính xác!");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-screen bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                <div className="p-4 bg-amber-600 text-white flex justify-between items-center">
                    <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                        <Key size={18} /> Đổi mật khẩu
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-md transition cursor-pointer"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleChangePassword} className="p-5 space-y-4 bg-gray-50">
                    {passwordError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                            <AlertTriangle size={16} className="shrink-0" /> <span>{passwordError}</span>
                        </div>
                    )}
                    {passwordSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 size={16} className="shrink-0" /> <span>{passwordSuccess}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Mật khẩu cũ</label>
                        <input type="password" required value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-amber-500 transition" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Mật khẩu mới</label>
                        <input type="password" required minLength="6" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Xác nhận mật khẩu mới</label>
                        <input type="password" required value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                    </div>
                    
                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition cursor-pointer">Hủy</button>
                        <button type="submit" disabled={!!passwordSuccess} className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"><CheckCircle2 size={18}/> Xác nhận đổi</button>
                    </div>
                </form>
            </div>
        </div>
    );
}