exports.up = function (knex) {
    return knex.schema.createTable('messages', (table) => {
        table.increments('id').primary();
        table.integer('sender_id').unsigned().notNullable();
        table.text('message').notNullable();
        table.text('sender_decrypt_key').notNullable();
        table.text('receiver_decrypt_key').notNullable();
        table.integer('conversation_id').unsigned().notNullable();
        table.text('iv').notNullable().defaultTo('');
        table.string('auth_tag').notNullable();
        table.timestamps(true, true);

        table.foreign('sender_id').references('id').inTable('users');
        table.foreign('conversation_id').references('id').inTable('conversations');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('messages');
};
