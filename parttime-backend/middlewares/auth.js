const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Chưa cung cấp Token xác thực!" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, ma_nhan_vien, vai_tro }
        next();
    } catch (error) {
        return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
};

const isManager = (req, res, next) => {
    if (req.user.vai_tro !== 'QUAN_LY') {
        return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này!" });
    }
    next();
};

module.exports = { verifyToken, isManager };