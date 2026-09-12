import React, { useState, useEffect, useRef } from 'react';

export default function WheelTimePicker({ hour, minute, onHourChange, onMinuteChange, label, minHour = 0, maxHour = 23 }) {
    const [isEditingH, setIsEditingH] = useState(false);
    const [tempH, setTempH] = useState(String(hour).padStart(2, '0'));
    const [isEditingM, setIsEditingM] = useState(false);
    const [tempM, setTempM] = useState(String(minute).padStart(2, '0'));
    
    const hourContainerRef = useRef(null); 
    const minuteContainerRef = useRef(null);
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
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase text-center tracking-wide">{label}</label>
            <div className="flex items-center justify-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-2 shadow-inner">
                <div ref={hourContainerRef} className="flex flex-col items-center justify-center select-none cursor-ns-resize px-1 w-12">
                    <div onClick={() => onHourChange(prevH)} className="text-gray-400 text-[11px] font-semibold hover:text-gray-600 py-0.5 cursor-pointer">{String(prevH).padStart(2, '0')}</div>
                    <div className="w-full flex justify-center">
                        {isEditingH ? (
                            <input type="number" autoFocus value={tempH} onChange={(e) => setTempH(e.target.value)} onBlur={handleBlurH} onKeyDown={(e) => { if (e.key === 'Enter') handleBlurH(); }} onFocus={(e) => e.target.select()} className="w-full bg-white border-2 border-blue-500 rounded-lg text-lg font-black text-[#0B1E3F] text-center outline-none py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
                        ) : (
                            <div onClick={() => setIsEditingH(true)} className="text-xl font-black text-[#0B1E3F] bg-white w-full text-center py-1 rounded-lg border border-gray-200 shadow-sm hover:border-blue-400 cursor-pointer">{String(hour).padStart(2, '0')}</div>
                        )}
                    </div>
                    <div onClick={() => onHourChange(nextH)} className="text-gray-400 text-[11px] font-semibold hover:text-gray-600 py-0.5 cursor-pointer">{String(nextH).padStart(2, '0')}</div>
                </div>
                <span className="font-black text-gray-300 text-lg pb-1">:</span>
                <div ref={minuteContainerRef} className="flex flex-col items-center justify-center select-none cursor-ns-resize px-1 w-12">
                    <div onClick={() => onMinuteChange(prevM)} className="text-gray-400 text-[11px] font-semibold hover:text-gray-600 py-0.5 cursor-pointer">{String(prevM).padStart(2, '0')}</div>
                    <div className="w-full flex justify-center">
                        {isEditingM ? (
                            <input type="number" autoFocus value={tempM} onChange={(e) => setTempM(e.target.value)} onBlur={handleBlurM} onKeyDown={(e) => { if (e.key === 'Enter') handleBlurM(); }} onFocus={(e) => e.target.select()} className="w-full bg-white border-2 border-blue-500 rounded-lg text-lg font-black text-[#0B1E3F] text-center outline-none py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
                        ) : (
                            <div onClick={() => setIsEditingM(true)} className="text-xl font-black text-[#0B1E3F] bg-white w-full text-center py-1 rounded-lg border border-gray-200 shadow-sm hover:border-blue-400 cursor-pointer">{String(minute).padStart(2, '0')}</div>
                        )}
                    </div>
                    <div onClick={() => onMinuteChange(nextM)} className="text-gray-400 text-[11px] font-semibold hover:text-gray-600 py-0.5 cursor-pointer">{String(nextM).padStart(2, '0')}</div>
                </div>
            </div>
        </div>
    );
}