const express = require('express');
const userController = require('../controllers/userController');
const messageController = require('../controllers/messageController');
const guestMiddleware = require('../middlewares/guestMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', guestMiddleware, userController.register);
router.post('/login', guestMiddleware, userController.login);

router.get('/conversations', authMiddleware, messageController.fetchConversations);
router.post('/send', authMiddleware, messageController.sendMessage);
router.get('/messages', authMiddleware, messageController.fetchMessages);
router.post('/search-users', authMiddleware, userController.searchUser);
router.get('/users', authMiddleware, userController.getAllUsers);
router.post('/conversation', authMiddleware, messageController.findOrCreateConversation);

module.exports = router;
