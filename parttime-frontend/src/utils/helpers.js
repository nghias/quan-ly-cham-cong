export const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export function parseMySqlDateTime(dateTimeStr) {
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

export const formatVND = (val) => {
    if (val === '' || val === null || val === undefined) return '';
    const strVal = String(val).replace(/\D/g, '');
    if (strVal === '') return '';
    const num = parseInt(strVal, 10);
    return isNaN(num) ? '' : num.toLocaleString('vi-VN');
};