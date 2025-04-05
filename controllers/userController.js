const userService = require('../services/userService');

async function register(req, res) {
    const { name, email, password } = req.body; // Use name instead of username and fullName
    try {
        const { publicKey } = await userService.register(name, email, password);
        res.status(201).send({ message: 'User registered successfully', publicKey });
    } catch (err) {
        res.status(500).send({ error: 'Error registering user' });
    }
}

async function login(req, res) {
    const { email, password } = req.body; // Use email instead of name
    try {
        const token = await userService.login(email, password);
        res.status(200).send({ token });
    } catch (err) {
        res.status(401).send({ error: 'Invalid credentials' });
    }
}

module.exports = { register, login };
