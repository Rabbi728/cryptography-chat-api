const express = require('express');
const userController = require('../controllers/userController');
const messageController = require('../controllers/messageController');

const router = express.Router();

// User routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Conversation routes
router.post('/conversations', messageController.createConversation);
router.get('/conversations', messageController.fetchConversations);

// Message routes
router.post('/send', messageController.sendMessage);
router.get('/messages', messageController.fetchMessages);

module.exports = router;
