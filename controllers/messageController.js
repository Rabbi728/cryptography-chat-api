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
    try {
        await sendMessageSchema.validate(req.body, { abortEarly: false });

        const { conversationId, message, senderDecryptKey, receiverDecryptKey, iv, authTag } = req.body;
        const senderId = req.user.id;

        await messageService.sendMessage(conversationId, senderId, message, senderDecryptKey, receiverDecryptKey, iv, authTag);

        res.status(200).send({ message: 'Message sent successfully' });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).send({ errors: err.errors });
        }
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
    const { userId } = req.user.id;
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
