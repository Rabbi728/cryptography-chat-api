async function handleConnection(socket, io) {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', ({ conversationId }) => {
        socket.join(`conversation_${conversationId}`);
        console.log(`Socket ${socket.id} joined room conversation_${conversationId}`);
    });

    socket.on('leaveRoom', ({ conversationId }) => {
        socket.leave(`conversation_${conversationId}`);
        console.log(`Socket ${socket.id} left room conversation_${conversationId}`);
    });

    socket.on('message', ({ conversationId, senderId, encryptedMessage }) => {
        try {
            io.to(`conversation_${conversationId}`).emit('message', {
                from: senderId,
                encryptedMessage,
            });
            console.log(`Message sent in room conversation_${conversationId} by user ${senderId}`);
        } catch (err) {
            console.error('Error relaying message:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
}

module.exports = { handleConnection };
