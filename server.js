require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// สร้างการเชื่อมต่อกับฐานข้อมูล
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// เริ่มต้น WebSocket server
wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', async (message) => {
        console.log('Received:', message);

        try {
            const data = JSON.parse(message);
            
            // บันทึกข้อความลงในฐานข้อมูล
            await saveMessage(data.userId, data.message);

            // ส่งข้อความไปยังผู้ใช้อื่นๆ
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// ฟังก์ชันสำหรับบันทึกข้อความในฐานข้อมูล
async function saveMessage(userId, message) {
    const query = 'INSERT INTO messages (user_id, content) VALUES ($1, $2)';
    await pool.query(query, [userId, message]);
}

// เริ่มต้น server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const { uploadFile } = require('./services/fileUploadService');

// ... โค้ดอื่นๆ ...

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'file') {
                const fileUrl = await uploadFile(data.file);
                // จัดการกับ fileUrl ต่อไป เช่น ส่งกลับไปยังผู้ใช้หรือเก็บในฐานข้อมูล
            }
            // จัดการกับข้อความประเภทอื่นๆ
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
});