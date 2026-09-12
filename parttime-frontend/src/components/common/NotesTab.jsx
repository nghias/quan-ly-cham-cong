import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { StickyNote, Calculator, Plus, Trash2, CheckCircle2, Circle, RotateCcw } from 'lucide-react';

export default function NotesTab() {
    const { user } = useContext(AuthContext);
    const userId = user?.id || localStorage.getItem('id') || 'guest';
    const storageKey = `sunday_notes_${userId}`;

    // 1. STATE CHO GHI CHÚ
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');

    // Load ghi chú từ LocalStorage
    useEffect(() => {
        const savedNotes = localStorage.getItem(storageKey);
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        }
    }, [storageKey]);

    // Save ghi chú vào LocalStorage mỗi khi có thay đổi
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

    // 2. STATE CHO MÁY ĐẾM TIỀN
    const denominations = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000];
    const [bills, setBills] = useState(
        denominations.reduce((acc, val) => ({ ...acc, [val]: '' }), {})
    );

    const handleBillChange = (val, countStr) => {
        const count = countStr.replace(/\D/g, ''); // Chỉ cho phép nhập số
        setBills(prev => ({ ...prev, [val]: count }));
    };

    const resetBills = () => {
        setBills(denominations.reduce((acc, val) => ({ ...acc, [val]: '' }), {}));
    };

    const totalMoney = denominations.reduce((sum, val) => {
        const count = parseInt(bills[val], 10) || 0;
        return sum + (val * count);
    }, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* CỘT 1: GHI CHÚ CÔNG VIỆC */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 bg-[#0B1E3F] text-white flex items-center gap-2 shrink-0">
                    <StickyNote size={18} className="text-[#FFD166]" />
                    <h2 className="text-sm font-black uppercase tracking-wider">Ghi chú công việc</h2>
                </div>
                
                <form onSubmit={handleAddNote} className="p-4 border-b border-gray-100 shrink-0 bg-gray-50 flex gap-2">
                    <input 
                        type="text" 
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Nhập việc cần làm..."
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <button type="submit" className="bg-[#0B1E3F] hover:bg-[#1D3557] text-white px-4 py-2.5 rounded-xl transition shadow-sm font-bold flex items-center gap-1 cursor-pointer">
                        <Plus size={18} /> Thêm
                    </button>
                </form>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/50">
                    {notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-70">
                            <StickyNote size={48} className="mb-3" />
                            <p className="text-sm font-medium">Chưa có ghi chú nào.</p>
                        </div>
                    ) : (
                        notes.map(note => (
                            <div key={note.id} className={`flex items-start gap-3 p-3 rounded-xl border transition ${note.completed ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-blue-100 shadow-sm'}`}>
                                <button onClick={() => toggleNote(note.id)} className="mt-0.5 shrink-0 text-emerald-600 hover:scale-110 transition cursor-pointer">
                                    {note.completed ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-gray-400" />}
                                </button>
                                <p className={`flex-1 text-sm font-medium break-words ${note.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                    {note.text}
                                </p>
                                <button onClick={() => deleteNote(note.id)} className="shrink-0 text-gray-400 hover:text-red-500 transition cursor-pointer p-0.5">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* CỘT 2: CÔNG CỤ ĐẾM TIỀN */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 bg-emerald-700 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <Calculator size={18} className="text-emerald-200" />
                        <h2 className="text-sm font-black uppercase tracking-wider">Trợ lý đếm tiền</h2>
                    </div>
                    <button onClick={resetBills} className="text-xs flex items-center gap-1 font-bold bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition cursor-pointer">
                        <RotateCcw size={12}/> Làm lại
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        {denominations.map(val => (
                            <div key={val} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-xs hover:border-emerald-300 transition">
                                <span className={`w-20 text-right font-black text-sm ${val >= 100000 ? 'text-blue-800' : 'text-gray-700'}`}>
                                    {val.toLocaleString('vi-VN')}đ
                                </span>
                                <span className="text-gray-400 text-xs font-bold shrink-0">x</span>
                                <div className="relative flex-1">
                                    <input 
                                        type="text"
                                        inputMode="numeric"
                                        value={bills[val]}
                                        onChange={(e) => handleBillChange(val, e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        placeholder="0"
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg py-1.5 pl-3 pr-8 text-sm font-bold text-gray-900 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition text-right"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">tờ</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-5 bg-emerald-50 border-t border-emerald-100 shrink-0">
                    <div className="flex justify-between items-end">
                        <span className="text-emerald-800 text-sm font-bold uppercase">Tổng cộng:</span>
                        <span className="text-3xl font-black text-emerald-600 tracking-tight">
                            {totalMoney.toLocaleString('vi-VN')} <span className="text-lg">VNĐ</span>
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
}