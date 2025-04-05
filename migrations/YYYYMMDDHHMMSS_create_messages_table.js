exports.up = function (knex) {
    return knex.schema.createTable('messages', (table) => {
        table.increments('id').primary();
        table.string('sender_id').notNullable();
        table.string('receiver_id').notNullable();
        table.text('message').notNullable();
        table.text('sender_decrypt_key').notNullable(); // Add sender_decrypt_key column
        table.text('receiver_decrypt_key').notNullable(); // Add receiver_decrypt_key column
        table.integer('conversation_id').unsigned().notNullable();
        table.timestamp('timestamp').defaultTo(knex.fn.now());

        table.foreign('sender_id').references('socket_id').inTable('users');
        table.foreign('receiver_id').references('socket_id').inTable('users');
        table.foreign('conversation_id').references('id').inTable('conversations');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('messages');
};
