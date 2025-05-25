require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const socketController = require('./controllers/socketController');
const apiRoutes = require('./routes/apiRoutes');
const socketService = require('./services/socketService')
const path = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
socketService(io.of("/chat-socket"));

app.use(cors());
app.use(express.json());

// Make io instance available to routes
app.set('io', io);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        port: process.env.APP_PORT 
    });
});

app.use('/api', apiRoutes);

io.on('connection', (socket) => {
    socketController.handleConnection(socket, io);
});

server.listen(process.env.APP_PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.APP_PORT}`);
});