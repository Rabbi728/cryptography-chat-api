const knex = require('knex')(require('../knexfile'));

async function createConversation(name, participants) {
    const [conversationId] = await knex('conversations')
        .insert({ name, created_at: knex.fn.now(), updated_at: knex.fn.now() })
        .returning('id');

    const participantRecords = participants.map((userId) => ({
        conversation_id: conversationId,
        user_id: userId,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
    }));
    await knex('conversation_participants').insert(participantRecords);

    return conversationId;
}

async function sendMessage(conversationId, senderId, message, senderDecryptKey, receiverDecryptKey, iv, authTag) {
    await knex('messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message,
        sender_decrypt_key: senderDecryptKey,
        receiver_decrypt_key: receiverDecryptKey,
        iv,
        auth_tag: authTag,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
    });
}

async function fetchMessagesWithDetails(conversationId, userId) {
    const messages = await knex('messages')
        .where({ conversation_id: conversationId })
        .orderBy('created_at', 'asc');

    const otherParticipant = await knex('conversation_participants')
        .join('users', 'conversation_participants.user_id', 'users.id')
        .where('conversation_participants.conversation_id', conversationId)
        .andWhere('users.id', '!=', userId)
        .select('users.id as user_id', 'users.name', 'users.email', 'users.public_key')
        .first();

    return {
        messages : [...messages],
        recipient: otherParticipant,
    };
}

async function fetchConversations(userId) {
    const conversations = await knex('conversations')
        .join('conversation_participants', 'conversations.id', 'conversation_participants.conversation_id')
        .where('conversation_participants.user_id', userId)
        .select('conversations.*')
        .orderBy('conversations.created_at', 'desc');

    const conversationsWithLastMessage = await Promise.all(conversations.map(async (conversation) => {
        const lastMessage = await knex('messages')
            .where('conversation_id', conversation.id)
            .orderBy('created_at', 'desc')
            .first();
        
        const participants = await knex('conversation_participants')
            .join('users', 'conversation_participants.user_id', 'users.id')
            .where('conversation_participants.conversation_id', conversation.id)
            .andWhere('users.id', '!=', userId)
            .select('users.id', 'users.name', 'users.email');
        
        return {
            ...conversation,
            lastMessage: lastMessage || null,
            participants
        };
    }));

    return conversationsWithLastMessage;
}

async function findOrCreateConversation(authUserId, recipientId) {
    const conversation = await knex('conversations')
        .join('conversation_participants as cp1', 'conversations.id', 'cp1.conversation_id')
        .join('conversation_participants as cp2', 'conversations.id', 'cp2.conversation_id')
        .where('cp1.user_id', authUserId)
        .andWhere('cp2.user_id', recipientId)
        .select('conversations.*')
        .first();

    if (!conversation) {
        const conversationId = await createConversation("", [authUserId, recipientId]);
        return await knex('conversations').where({ id: conversationId }).first();
    }

    return conversation;
}

module.exports = { createConversation, sendMessage, fetchMessagesWithDetails, fetchConversations, findOrCreateConversation };
