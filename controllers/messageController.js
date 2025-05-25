const messageService = require('../services/messageService');
const userService = require('../services/userService');
const yup = require('yup');

const sendMessageSchema = yup.object().shape({
    conversationId: yup.number().required('Conversation ID is required'),
    message: yup.string().required('Message is required'),
    senderDecryptKey: yup.string().required('Sender decrypt key is required'),
    receiverDecryptKey: yup.string().required('Receiver decrypt key is required'),
    iv: yup.string().required('IV is required'),
    authTag: yup.string().required('Auth tag is required'),
});

async function sendMessage(req, res) {
    try {
        await sendMessageSchema.validate(req.body, { abortEarly: false });

        const { conversationId, message, senderDecryptKey, receiverDecryptKey, iv, authTag } = req.body;
        const senderId = req.user.id;

        // Send message and get the saved message data
        const savedMessage = await messageService.sendMessage(conversationId, senderId, message, senderDecryptKey, receiverDecryptKey, iv, authTag);

        // Get conversation details to find recipient
        const conversationDetails = await messageService.getConversationDetails(conversationId, senderId);
        
        // Emit socket notification for new message
        const io = req.app.get('io');
        if (io && conversationDetails) {
            // Get the complete message data with timestamp
            const completeMessageData = {
                id: savedMessage?.id || Date.now(),
                conversation_id: conversationId,
                sender_id: senderId,
                message: message,
                sender_decrypt_key: senderDecryptKey,
                receiver_decrypt_key: receiverDecryptKey,
                iv: iv,
                auth_tag: authTag,
                created_at: new Date().toISOString(),
                conversationId: conversationId,
                recipientId: conversationDetails.recipientId
            };
            
            // Notify both users about the new message
            io.of("/chat-socket").to(`user_${senderId}`).emit('refreshConversations', {
                type: "message_sent",
                conversationId: conversationId
            });
            
            io.of("/chat-socket").to(`user_${conversationDetails.recipientId}`).emit('refreshConversations', {
                type: "message_received", 
                conversationId: conversationId
            });
            
            // Send newMessage event for users not currently in the chat
            io.of("/chat-socket").to(`user_${conversationDetails.recipientId}`).emit('newMessage', {
                conversationId: conversationId,
                senderId: senderId,
                recipientId: conversationDetails.recipientId,
                message: completeMessageData
            });
        }

        // Return success response with the saved message
        res.status(200).json({ 
            success: true, 
            message: 'Message sent successfully', 
            id: savedMessage.id,
            created_at: savedMessage.created_at
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).send({ errors: err.errors });
        }
        console.error('Error sending message:', err);
        res.status(500).send({ error: 'Error sending message', details: err.message });
    }
}

async function fetchMessages(req, res) {
    const { conversationId } = req.query;
    const userEmail = req.user.email;

    try {
        const user = await userService.getUserByEmail(userEmail);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        const messages = await messageService.fetchMessagesWithDetails(conversationId, user.id);
        res.status(200).send(messages);
    } catch (err) {
        res.status(500).send({ error: 'Error fetching messages' });
    }
}

async function fetchConversations(req, res) {
    const { id } = req.user;
    try {
        const conversations = await messageService.fetchConversations(id);
        res.status(200).send(conversations);
    } catch (err) {
        console.log(err);
        
        res.status(500).send({ error: 'Error fetching conversations' });
    }
}

async function findOrCreateConversation(req, res) {
    try {
        const authUserId = req.user.id;
        const { recipientId } = req.body;

        if (!recipientId) {
            return res.status(400).send({ error: 'Recipient ID is required' });
        }

        const conversation = await messageService.findOrCreateConversation(authUserId, recipientId);
        
        // Emit socket notification for conversation creation/access
        const io = req.app.get('io');
        if (io) {
            io.of("/chat-socket").emit('conversationCreated', {
                creatorId: authUserId,
                recipientId: parseInt(recipientId),
                conversationId: conversation.id,
                conversation: conversation
            });
        }
        
        res.status(200).send(conversation);
    } catch (err) {
        console.error('Error in findOrCreateConversation:', err);
        res.status(500).send({ error: 'Error processing conversation' });
    }
}

module.exports = { sendMessage, fetchMessages, fetchConversations, findOrCreateConversation };
