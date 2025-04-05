exports.up = function (knex) {
    return knex.schema.createTable('conversation_participants', (table) => {
        table.increments('id').primary();
        table.integer('conversation_id').unsigned().notNullable();
        table.integer('user_id').unsigned().notNullable();

        table.foreign('conversation_id').references('id').inTable('conversations').onDelete('CASCADE');
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('conversation_participants');
};
