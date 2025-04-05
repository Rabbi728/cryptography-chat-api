const knex = require('knex')(require('../knexfile'));

async function createConversation(name, participants) {
    const [conversationId] = await knex('conversations').insert({ name }).returning('id');

    const participantRecords = participants.map((userId) => ({
        conversation_id: conversationId,
        user_id: userId,
    }));
    await knex('conversation_participants').insert(participantRecords);

    return conversationId;
}

async function sendMessage(conversationId, senderId, receiverId, message, senderDecryptKey, receiverDecryptKey) {
    await knex('messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        message,
        sender_decrypt_key: senderDecryptKey, // Store sender's decryption key
        receiver_decrypt_key: receiverDecryptKey, // Store receiver's decryption key
    });
}

async function fetchMessages(conversationId) {
    return await knex('messages')
        .where({ conversation_id: conversationId })
        .orderBy('timestamp', 'desc');
}

async function fetchConversations(userId) {
    return await knex('conversations')
        .join('conversation_participants', 'conversations.id', 'conversation_participants.conversation_id')
        .where('conversation_participants.user_id', userId)
        .select('conversations.*')
        .orderBy('conversations.created_at', 'desc');
}

module.exports = { createConversation, sendMessage, fetchMessages, fetchConversations };
