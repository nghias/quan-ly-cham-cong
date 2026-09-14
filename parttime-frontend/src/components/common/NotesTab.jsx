import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { StickyNote, Calculator, Plus, Trash2, CheckCircle2, Circle, RotateCcw, PenLine, Receipt } from 'lucide-react';

export default function NotesTab() {
    const { user } = useContext(AuthContext);
    const userId = user?.id || localStorage.getItem('id') || 'guest';
    const storageKey = `sunday_notes_${userId}`;

    // ---------------- STATE CHO GHI CHÚ ----------------
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        const savedNotes = localStorage.getItem(storageKey);
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        }
    }, [storageKey]);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(notes));
    }, [notes, storageKey]);

    const handleAddNote = (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        const newNoteObj = {
            id: Date.now(),
            text: newNote.trim(),
            completed: false
        };
        setNotes([newNoteObj, ...notes]);
        setNewNote('');
    };

    const toggleNote = (id) => {
        setNotes(notes.map(note => note.id === id ? { ...note, completed: !note.completed } : note));
    };

    const deleteNote = (id) => {
        setNotes(notes.filter(note => note.id !== id));
    };

    // ---------------- STATE CHO MÁY ĐẾM TIỀN ----------------
    const denominations = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000];
    const [bills, setBills] = useState(
        denominations.reduce((acc, val) => ({ ...acc, [val]: '' }), {})
    );

    const handleBillChange = (val, countStr) => {
        const count = countStr.replace(/\D/g, ''); // Chỉ cho phép nhập số
        setBills(prev => ({ ...prev, [val]: count }));
    };

    const resetBills = () => {
        if(window.confirm("Bạn muốn xóa trắng bảng đếm tiền?")) {
            setBills(denominations.reduce((acc, val) => ({ ...acc, [val]: '' }), {}));
        }
    };

    const totalMoney = denominations.reduce((sum, val) => {
        const count = parseInt(bills[val], 10) || 0;
        return sum + (val * count);
    }, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* CỘT 1: GHI CHÚ CÔNG VIỆC */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[650px] relative">
                <div className="p-4 bg-[#0B1E3F] text-white flex items-center gap-2 shrink-0 shadow-sm z-10">
                    <PenLine size={18} className="text-[#FFD166]" />
                    <h2 className="text-sm font-black uppercase tracking-wider">Ghi chú công việc</h2>
                </div>
                
                {/* Form Nhập Ghi Chú */}
                <form onSubmit={handleAddNote} className="p-4 border-b border-gray-200 shrink-0 bg-[#FFFBEB] flex gap-3 shadow-inner">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Hôm nay bạn cần làm gì?..."
                            className="w-full pl-4 pr-4 py-3 rounded-xl border border-yellow-300 text-sm font-bold text-gray-800 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 bg-white placeholder-gray-400 transition shadow-sm"
                        />
                    </div>
                    <button type="submit" className="bg-[#FFD166] hover:bg-yellow-400 text-[#0B1E3F] px-5 py-3 rounded-xl transition shadow-md font-black flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95">
                        <Plus size={18} strokeWidth={3} /> Thêm
                    </button>
                </form>

                {/* Danh sách Ghi Chú */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/80 custom-scrollbar">
                    {notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                            <StickyNote size={64} className="mb-4 text-gray-300" strokeWidth={1.5} />
                            <p className="text-sm font-bold">Chưa có ghi chú nào.</p>
                            <p className="text-xs mt-1">Hãy thêm công việc cần làm vào ô bên trên nhé!</p>
                        </div>
                    ) : (
                        notes.map(note => (
                            <div 
                                key={note.id} 
                                className={`group flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                                    note.completed 
                                        ? 'bg-gray-100 border-gray-200 opacity-60 scale-[0.98]' 
                                        : 'bg-white border-l-4 border-l-yellow-400 border-y-gray-200 border-r-gray-200 hover:-translate-y-0.5'
                                }`}
                            >
                                <button onClick={() => toggleNote(note.id)} className="mt-0.5 shrink-0 transition cursor-pointer">
                                    {note.completed 
                                        ? <CheckCircle2 size={22} className="text-emerald-500" /> 
                                        : <Circle size={22} className="text-gray-300 hover:text-emerald-400" />
                                    }
                                </button>
                                <p className={`flex-1 text-sm leading-relaxed pt-0.5 break-words ${note.completed ? 'line-through text-gray-500 font-medium' : 'text-gray-800 font-bold'}`}>
                                    {note.text}
                                </p>
                                <button onClick={() => deleteNote(note.id)} className="shrink-0 text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition cursor-pointer opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* CỘT 2: CÔNG CỤ ĐẾM TIỀN */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[650px] relative">
                <div className="p-4 bg-emerald-700 text-white flex justify-between items-center shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-2">
                        <Receipt size={18} className="text-emerald-200" />
                        <h2 className="text-sm font-black uppercase tracking-wider">Trợ lý đếm tiền</h2>
                    </div>
                    <button onClick={resetBills} className="text-xs flex items-center gap-1.5 font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-sm">
                        <RotateCcw size={14}/> Làm lại
                    </button>
                </div>

                {/* Tiêu đề Bảng */}
                <div className="flex items-center px-6 py-3 bg-emerald-50 border-b border-emerald-100 shrink-0">
                    <div className="w-[35%] text-xs font-black text-emerald-800 uppercase tracking-wide">Mệnh giá</div>
                    <div className="w-[30%] text-xs font-black text-emerald-800 uppercase tracking-wide text-center">Số tờ</div>
                    <div className="w-[35%] text-xs font-black text-emerald-800 uppercase tracking-wide text-right">Thành tiền</div>
                </div>

                {/* Danh sách nhập tiền */}
                <div className="flex-1 overflow-y-auto p-2 bg-white custom-scrollbar">
                    <div className="flex flex-col">
                        {denominations.map(val => {
                            const count = parseInt(bills[val], 10) || 0;
                            const rowTotal = val * count;
                            
                            return (
                                <div key={val} className="flex items-center px-4 py-2.5 border-b border-dashed border-gray-100 last:border-0 hover:bg-gray-50 transition rounded-lg">
                                    
                                    {/* Cột 1: Mệnh giá */}
                                    <div className={`w-[35%] font-black text-[15px] ${val >= 100000 ? 'text-blue-900' : 'text-gray-700'}`}>
                                        {val.toLocaleString('vi-VN')}
                                    </div>
                                    
                                    {/* Cột 2: Số tờ (Input) */}
                                    <div className="w-[30%] flex justify-center">
                                        <div className="relative w-20">
                                            <input 
                                                type="number"
                                                value={bills[val]}
                                                onChange={(e) => handleBillChange(val, e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                placeholder="0"
                                                className="w-full bg-white border border-gray-300 rounded-lg py-1.5 px-2 text-sm font-bold text-center text-[#0B1E3F] outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Cột 3: Thành tiền */}
                                    <div className="w-[35%] text-right font-black text-[15px]">
                                        {rowTotal > 0 ? (
                                            <span className="text-emerald-600">{rowTotal.toLocaleString('vi-VN')}</span>
                                        ) : (
                                            <span className="text-gray-300">0</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tổng Cộng Cuối Trang */}
                <div className="p-5 bg-emerald-50 border-t-2 border-emerald-200 shrink-0">
                    <div className="flex justify-between items-end">
                        <span className="text-emerald-800 text-sm font-black uppercase tracking-wider mb-1">Tổng cộng:</span>
                        <span className="text-3xl font-black text-emerald-700 tracking-tight drop-shadow-sm">
                            {totalMoney.toLocaleString('vi-VN')} <span className="text-lg font-bold">VNĐ</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* CSS Xóa thanh cuộn xấu */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
}