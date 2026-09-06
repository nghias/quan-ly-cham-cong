const express = require('express');
const cors = require('cors');
require('dotenv').config();
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/ping', (req, res) => {
    res.status(200).send('Server is alive!');
});

// Kích hoạt toàn bộ Routes
app.use('/api', routes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại cổng ${PORT}`);
});