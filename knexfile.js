module.exports = {
    client: 'mysql',
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'chat',
    },
    pool: { min: 2, max: 10 },
};
