require('dotenv').config();

module.exports = {
    client: 'mysql',
    connection: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'chat',
        port: process.env.MYSQL_PORT || 3306,
    },
    pool: { min: 2, max: 10 },
};
