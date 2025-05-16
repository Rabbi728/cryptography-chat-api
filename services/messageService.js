const knex = require('knex')(require('../knexfile'));

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
    await knex('conversations')
        .where({ id: conversationId })
        .update({ updated_at: knex.fn.now() });
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
    console.log(userId);
    const participations = await knex('conversation_participants')
        .select('conversation_id')
        .where('user_id', userId);
    
    const conversationIds = participations.map(p => p.conversation_id);
    
    const conversations = await knex('conversations')
        .whereIn('id', conversationIds)
        .orderBy('updated_at', 'desc');
    
    const enhancedConversations = await Promise.all(
        conversations.map(async (conversation) => {
            const otherParticipants = await knex('conversation_participants')
                .join('users', 'conversation_participants.user_id', 'users.id')
                .where('conversation_participants.conversation_id', conversation.id)
                .andWhere('users.id', '!=', userId)
                .select('users.id as user_id', 'users.name')
                .first();

            const lastMessage = await knex('messages')
                .where('conversation_id', conversation.id)
                .orderBy('created_at', 'desc')
                .first();

            return {
                ...conversation,
                participants: otherParticipants,
                lastMessage: lastMessage || null
            };
        })
    );

    return enhancedConversations;
}

async function findOrCreateConversation(authUserId, recipientId) {
    try {
        const existingConversation = await knex('conversations')
            .where(function() {
                this.where('creator_id', authUserId).andWhere('recipient_id', recipientId)
                    .orWhere(function() {
                        this.where('creator_id', recipientId).andWhere('recipient_id', authUserId)
                    });
            })
            .first();
        
        if (existingConversation) {
            return existingConversation;
        }
        
        return await knex.transaction(async (trx) => {
            const lockedCheck = await trx('conversations')
                .where(function() {
                    this.where('creator_id', authUserId).andWhere('recipient_id', recipientId)
                        .orWhere(function() {
                            this.where('creator_id', recipientId).andWhere('recipient_id', authUserId)
                        });
                })
                .forUpdate()
                .first();
            
            if (lockedCheck) {
                return lockedCheck;
            }
            
            const [conversationId] = await trx('conversations')
                .insert({ 
                    name: "", 
                    creator_id: authUserId, 
                    recipient_id: recipientId, 
                    created_at: trx.fn.now(), 
                    updated_at: trx.fn.now() 
                })
                .returning('id');
                
            const participantRecords = [authUserId, recipientId].map((userId) => ({
                conversation_id: conversationId,
                user_id: userId,
                created_at: trx.fn.now(),
                updated_at: trx.fn.now(),
            }));
            await trx('conversation_participants').insert(participantRecords);
            
            return await trx('conversations').where({ id: conversationId }).first();
        });
    } catch (error) {
        console.error('Error in findOrCreateConversation:', error);
        const fallbackCheck = await knex('conversations')
            .where(function() {
                this.where('creator_id', authUserId).andWhere('recipient_id', recipientId)
                    .orWhere(function() {
                        this.where('creator_id', recipientId).andWhere('recipient_id', authUserId)
                    });
            })
            .first();
        
        if (fallbackCheck) {
            return fallbackCheck;
        }
        
        throw error;
    }
}

module.exports = { sendMessage, fetchMessagesWithDetails, fetchConversations, findOrCreateConversation };
