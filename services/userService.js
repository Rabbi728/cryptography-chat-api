const knex = require('knex')(require('../knexfile'));
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const SECRET_KEY = process.env.SECRET_KEY || 'default_secret_key';
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_key';

function encryptPrivateKey(privateKey) {
    const cipher = crypto.createCipher('aes-256-cbc', SECRET_KEY);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decryptPrivateKey(encryptedPrivateKey) {
    const decipher = crypto.createDecipher('aes-256-cbc', SECRET_KEY);
    let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

async function generateKeyPair() {
    const generateKeyPairAsync = promisify(crypto.generateKeyPair);
    const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { publicKey, privateKey };
}

async function register(name, email, password) {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const { publicKey, privateKey } = await generateKeyPair();
    const encryptedPrivateKey = encryptPrivateKey(privateKey);

    await knex('users').insert({
        name,
        email,
        password: hashedPassword,
        public_key: publicKey,
        private_key: encryptedPrivateKey,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
    });

    return { publicKey };
}

async function login(email, password) {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const user = await knex('users').where({ email, password: hashedPassword }).first();
    if (!user) throw new Error('Invalid credentials');
    return jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
}

async function getPrivateKey(userId) {
    const user = await knex('users').where({ id: userId }).first();
    if (!user || !user.private_key) throw new Error('Private key not found');
    return decryptPrivateKey(user.private_key);
}

async function getUserByEmail(email) {
    return await knex('users').where({ email }).first();
}

module.exports = { register, login, getPrivateKey, getUserByEmail };
