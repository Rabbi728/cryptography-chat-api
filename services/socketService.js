module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("Chat User Connected:", socket.id);

        socket.on('SendMessage', (msg) => {
            io.to(msg.conversationId).emit("RceiveMessage", msg);
            io.emit("syncChatSidebar", msg);
        })
        socket.on('RceiveMessage', (msg) => {
            console.log(msg);
         })
        socket.on('syncChatSidebar', (msg) => { 
            console.log(msg);
        })
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
        })
    });
}