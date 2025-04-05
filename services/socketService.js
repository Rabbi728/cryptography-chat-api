const knex = require('knex')(require('../knexfile'));

async function storePublicKey(socketId, publicKey) {
    await knex('users')
        .insert({ socket_id: socketId, public_key: publicKey })
        .onConflict('socket_id')
        .merge();
}

async function deleteUser(socketId) {
    await knex('users').where({ socket_id: socketId }).del();
}

async function getUserBySocketId(socketId) {
    return await knex('users').where({ socket_id: socketId }).first();
}

async function saveMessage(senderId, receiverId, message) {
    await knex('messages').insert({
        sender_id: senderId,
        receiver_id: receiverId,
        message,
    });
}

module.exports = { storePublicKey, deleteUser, getUserBySocketId, saveMessage };
