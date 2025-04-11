const messageService = require('../services/messageService');
const userService = require('../services/userService');

async function createConversation(req, res) {
    const { name, participants } = req.body;
    try {
        const conversationId = await messageService.createConversation(name, participants);
        res.status(201).send({ conversationId });
    } catch (err) {
        res.status(500).send({ error: 'Error creating conversation' });
    }
}

async function sendMessage(req, res) {
    const { conversationId, message, senderDecryptKey, receiverDecryptKey, vi } = req.body; // Include vi
    const senderId = req.user.id;

    try {
        await messageService.sendMessage(conversationId, senderId, message, senderDecryptKey, receiverDecryptKey, vi); // Pass vi
        await knex('conversations')
            .where({ id: conversationId })
            .update({ updated_at: knex.fn.now() }); // Update updated_at for the conversation
        res.status(200).send({ message: 'Message sent successfully' });
    } catch (err) {
        res.status(500).send({ error: 'Error sending message' });
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
    const { userId } = req.query;
    try {
        const conversations = await messageService.fetchConversations(userId);
        res.status(200).send(conversations);
    } catch (err) {
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
        res.status(200).send(conversation);
    } catch (err) {
        res.status(500).send({ error: 'Error processing conversation' });
    }
}

module.exports = { createConversation, sendMessage, fetchMessages, fetchConversations, findOrCreateConversation };
