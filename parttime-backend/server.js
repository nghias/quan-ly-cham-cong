const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
require('dotenv').config();
const routes = require('./routes');

const app = express();
const server = http.createServer(app); 

// Cấu hình Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Lắng nghe tín hiệu từ Frontend
io.on('connection', (socket) => {
    console.log('🟢 Có thiết bị vừa kết nối Socket:', socket.id);

    socket.on('schedule_changed', () => {
        // Dùng io.emit để phát tín hiệu cập nhật đến TẤT CẢ các cửa sổ
        io.emit('update_schedule');
    });

    socket.on('disconnect', () => {
        console.log('🔴 Đã ngắt kết nối Socket:', socket.id);
    });
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/ping', (req, res) => {
    res.status(200).send('Server is alive!');
});

app.use('/api', routes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại cổng ${PORT}`);
});