const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const shiftController = require('../controllers/shiftController');
const budgetController = require('../controllers/budgetController');
const userController = require('../controllers/userController');
const branchController = require('../controllers/branchController');
const { verifyToken, isManager } = require('../middlewares/auth');

// ================== AUTH & TÀI KHOẢN CÁ NHÂN ==================
router.post('/login', authController.login);

// Route cá nhân (Lưu ý: Bắt buộc đặt TRƯỚC các route có /:id)
router.get('/me', verifyToken, userController.getMyProfile);
router.put('/change-password', verifyToken, userController.changePassword);


// ================== QUẢN LÝ NHÂN SỰ (CHỈ QUẢN LÝ) ==================
router.get('/users', verifyToken, userController.layDanhSachNhanVien);
router.post('/users', verifyToken, isManager, userController.taoTaiKhoan);
router.put('/users/:id', verifyToken, isManager, userController.suaTaiKhoan);
router.put('/users/:id/disable', verifyToken, isManager, userController.voHieuHoaTaiKhoan);
router.post('/users/:id/reset-password', verifyToken, isManager, userController.resetMatKhau);


// ================== QUẢN LÝ CHI NHÁNH ==================
router.get('/branches', verifyToken, branchController.getAllBranches); // Ai cũng xem được để chọn chi nhánh
router.post('/branches', verifyToken, isManager, branchController.createBranch);
router.put('/branches/:id', verifyToken, isManager, branchController.updateBranch);
router.delete('/branches/:id', verifyToken, isManager, branchController.deleteBranch);


// ================== ĐĂNG KÝ CA NGUYỆN VỌNG ==================
// (Cả Quản lý & Nhân viên đều xem và đăng ký được)
router.get('/shifts/registrations', verifyToken, shiftController.getRegistrations);
router.post('/shifts/registrations', verifyToken, shiftController.createRegistration);
router.put('/shifts/registrations/:id', verifyToken, shiftController.updateRegistration);
router.delete('/shifts/registrations/:id', verifyToken, shiftController.deleteRegistration);


// ================== LỊCH LÀM VIỆC THỰC TẾ ==================
// Tất cả nhân viên đều ĐƯỢC XEM lịch làm thực tế
router.get('/shifts', verifyToken, shiftController.getShifts);

// CHỈ QUẢN LÝ mới được phép thao tác Xếp/Sửa/Xóa lịch thực tế
router.post('/shifts/schedule', verifyToken, isManager, shiftController.xepLich);
router.put('/shifts/update/:id', verifyToken, isManager, shiftController.capNhatLich);
router.delete('/shifts/delete/:id', verifyToken, isManager, shiftController.xoaLich);


// ================== QUẢN LÝ QUỸ LƯƠNG (CHỈ QUẢN LÝ) ==================
router.get('/budget/q8', verifyToken, isManager, budgetController.kiemTraNganSach);
router.post('/budget/q8', verifyToken, isManager, budgetController.capNhatNganSach);


module.exports = router;