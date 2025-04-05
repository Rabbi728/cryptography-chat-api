const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const socketController = require('./controllers/socketController');
const apiRoutes = require('./routes/apiRoutes'); // Add API routes

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json()); // Middleware for JSON parsing
app.use('/api', apiRoutes); // Mount API routes

io.on('connection', (socket) => {
    socketController.handleConnection(socket, io);
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
