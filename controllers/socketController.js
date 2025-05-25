const knex = require('knex')(require('../knexfile'));

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

// Get details of online users from the database
async function getOnlineUserDetails(onlineUserIds) {
    try {
        // Convert all IDs to strings for comparison
        const stringIds = onlineUserIds.map(id => id.toString());
        
        // Fetch user details for the online users
        const users = await knex('users')
            .select('id', 'name', 'email', 'avatar')
            .whereIn('id', stringIds);
            
        return users.map(user => ({
            ...user,
            isOnline: true
        }));
    } catch (error) {
        console.error('Error fetching online user details:', error);
        return [];
    }
}

module.exports = { 
    handleConnection, 
    getOnlineUserDetails 
};
