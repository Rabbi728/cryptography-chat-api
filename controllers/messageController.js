const messageService = require('../services/messageService');

async function createConversation(req, res) {
    const { name, participants } = req.body; // `participants` is an array of user IDs
    try {
        const conversationId = await messageService.createConversation(name, participants);
        res.status(201).send({ conversationId });
    } catch (err) {
        res.status(500).send({ error: 'Error creating conversation' });
    }
}

async function sendMessage(req, res) {
    const { conversationId, senderId, receiverId, message, senderDecryptKey, receiverDecryptKey } = req.body; // Accept decryption keys
    try {
        await messageService.sendMessage(conversationId, senderId, receiverId, message, senderDecryptKey, receiverDecryptKey);
        res.status(200).send({ message: 'Message sent successfully' });
    } catch (err) {
        res.status(500).send({ error: 'Error sending message' });
    }
}

async function fetchMessages(req, res) {
    const { conversationId } = req.query;
    try {
        const messages = await messageService.fetchMessages(conversationId);
        res.status(200).send(messages);
    } catch (err) {
        res.status(500).send({ error: 'Error fetching messages' });
    }
}

async function fetchConversations(req, res) {
    const { userId } = req.query; // Fetch conversations for a specific user
    try {
        const conversations = await messageService.fetchConversations(userId);
        res.status(200).send(conversations);
    } catch (err) {
        res.status(500).send({ error: 'Error fetching conversations' });
    }
}

module.exports = { createConversation, sendMessage, fetchMessages, fetchConversations };
