exports.up = function (knex) {
    return knex.schema.alterTable('conversations', (table) => {
        table.integer('creator_id').unsigned().nullable().after('name');
        table.integer('recipient_id').unsigned().nullable().after('creator_id');
        table.foreign('creator_id').references('id').inTable('users').onDelete('CASCADE');
        table.foreign('recipient_id').references('id').inTable('users').onDelete('CASCADE');
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('conversations', (table) => {
        table.dropForeign(['creator_id', 'recipient_id']);
        table.dropColumn(['creator_id', 'recipient_id']);
    });
};
