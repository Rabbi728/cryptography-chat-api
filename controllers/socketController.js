const socketService = require('../services/socketService');

async function handleConnection(socket, io) {
    console.log('A user connected:', socket.id);

    socket.on('publicKey', async (publicKey) => {
        try {
            await socketService.storePublicKey(socket.id, publicKey);
            console.log(`Public key stored for ${socket.id}`);
        } catch (err) {
            console.error('Error storing public key:', err);
        }
    });

    socket.on('message', async ({ to, encryptedMessage }) => {
        try {
            const recipient = await socketService.getUserBySocketId(to);
            if (recipient) {
                io.to(to).emit('message', { from: socket.id, encryptedMessage });
                await socketService.saveMessage(socket.id, to, encryptedMessage);
            }
        } catch (err) {
            console.error('Error relaying message:', err);
        }
    });

    socket.on('disconnect', async () => {
        console.log('A user disconnected:', socket.id);
        try {
            await socketService.deleteUser(socket.id);
        } catch (err) {
            console.error('Error removing user:', err);
        }
    });
}

module.exports = { handleConnection };
