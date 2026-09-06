const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, // Đảm bảo trỏ đúng biến DB_NAME (quan_ly_parttime)
    port: Number(process.env.DB_PORT) || 4000, // Cổng 4000 đặt đúng chỗ port
    ssl: {
        minVersion: 'TLSv1.2',
        ca: fs.readFileSync(path.join(__dirname, process.env.CA_FILE_NAME || '../isrgrootx1.pem'))
    }
});

module.exports = pool.promise();