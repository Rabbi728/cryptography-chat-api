// Track online users
const onlineUsers = new Map();

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("Chat User Connected:", socket.id);
        
        // User joins their personal room for notifications
        socket.on('joinUserRoom', (userId) => {
            // Store the user ID with this socket
            socket.userId = userId;
            socket.join(`user_${userId}`);
            
            // Mark user as online
            onlineUsers.set(userId.toString(), {
                socketId: socket.id,
                lastActive: new Date()
            });
            
            // Broadcast user online status to all connected clients
            io.emit("userStatus", {
                userId: userId,
                status: "online",
                timestamp: new Date().toISOString()
            });
            
            console.log(`User ${userId} joined personal room user_${userId} and is now online`);
            console.log(`Online users: ${Array.from(onlineUsers.keys()).join(', ')}`);
        });

        socket.on('SendMessage', (msg) => {
            // Add timestamp if not present
            if (!msg.created_at) {
                msg.created_at = new Date().toISOString();
            }
            
            // Send message to all users in the conversation room
            io.to(msg.conversationId).emit("ReceiveMessage", msg);
            
            // Send sidebar sync to all connected users
            io.emit("syncChatSidebar", msg);
            
            // Send specific notifications to users not in the chat room
            if (msg.sender_id && msg.recipientId) {
                // Notify sender
                io.to(`user_${msg.sender_id}`).emit("refreshConversations", {
                    type: "message_sent",
                    conversationId: msg.conversationId
                });
                
                // Notify recipient 
                io.to(`user_${msg.recipientId}`).emit("refreshConversations", {
                    type: "message_received", 
                    conversationId: msg.conversationId
                });
                
                // Also send newMessage event for users not in specific chat rooms
                io.to(`user_${msg.recipientId}`).emit("newMessage", {
                    conversationId: msg.conversationId,
                    senderId: msg.sender_id,
                    recipientId: msg.recipientId,
                    message: msg
                });
            }
        })

        socket.on('ReceiveMessage', (msg) => {
            console.log(msg);
         })

        socket.on('syncChatSidebar', (msg) => { 
            console.log(msg);
        })

        // New event for conversation creation
        socket.on('conversationCreated', (data) => {
            const { creatorId, recipientId, conversationId } = data;
            
            // Notify both users to refresh their conversation lists
            io.to(`user_${creatorId}`).emit("refreshConversations", {
                type: "conversation_created",
                conversationId: conversationId,
                by: creatorId
            });
            io.to(`user_${recipientId}`).emit("refreshConversations", {
                type: "conversation_created", 
                conversationId: conversationId,
                by: creatorId
            });
            
            console.log(`Conversation ${conversationId} created notification sent to users ${creatorId} and ${recipientId}`);
        });

        socket.on('markAsRead', (convId) => { 
            io.emit("readConversation", convId);
        })

        socket.on('readConversation', (convId) => { 
            console.log(convId);
        })

        socket.on('userStatusUpdate', (convId) => { 
            console.log(convId);
        })

        socket.on("joinChat", ({conversationId}) => {
            socket.join(conversationId);
            console.log("User joined room:", conversationId);
            io.emit("userStatusUpdate", { conversationId, status: "online" });
        });

        socket.on("leaveChat", (userId) => {
            socket.leave(userId);
            io.emit("userStatusUpdate", { userId, status: "offline" });
        });

        socket.on('disconnect', () => {
            console.log("Chat User disConnected:", socket.id);
            
            // If we have the user's ID (from joinUserRoom), mark them as offline
            if (socket.userId) {
                // Remove user from online users
                onlineUsers.delete(socket.userId.toString());
                
                // Broadcast user offline status to all connected clients
                io.emit("userStatus", {
                    userId: socket.userId,
                    status: "offline",
                    timestamp: new Date().toISOString()
                });
                
                console.log(`User ${socket.userId} is now offline`);
                console.log(`Online users: ${Array.from(onlineUsers.keys()).join(', ')}`);
            }
        })
    });
    
    // Add a method to get all online users
    io.getOnlineUsers = () => {
        return Array.from(onlineUsers.keys());
    };
}