const express = require('express');
const { streamChatbotMessage } = require('../controllers/chatbot.controller');

const router = express.Router();

router.post('/message', streamChatbotMessage);

module.exports = router;
