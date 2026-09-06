const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Đọc file CA từ thư mục gốc (cùng cấp với .env)
const caPath = path.join(process.cwd(), process.env.CA_FILE_NAME);
const caCert = fs.readFileSync(caPath);

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000, // Mặc định port của TiDB Cloud là 4000
    ssl: {
        ca: caCert,
        rejectUnauthorized: true // Bắt buộc bật để xác thực bảo mật với TiDB
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(() => console.log('✅ Kết nối TiDB Cloud thành công!'))
    .catch((err) => console.error('❌ Lỗi kết nối TiDB:', err));

module.exports = pool;