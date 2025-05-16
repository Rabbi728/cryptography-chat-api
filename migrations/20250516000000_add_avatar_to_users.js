exports.up = function (knex) {
    return knex.schema.table('users', function(table) {
        table.string('avatar').nullable().after('password');
    });
};

exports.down = function (knex) {
    return knex.schema.table('users', function(table) {
        table.dropColumn('avatar');
    });
};
