exports.up = function (knex) {
    return knex.schema.createTable('conversations', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable(); // Optional: Name of the conversation
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('conversations');
};
