exports.up = function (knex) {
    return knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('socket_id').unique();
        table.text('public_key');
        table.text('private_key');
        table.string('name').notNullable(); // Replace username and full_name with name
        table.string('email').notNullable().unique();
        table.string('password').notNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('users');
};
