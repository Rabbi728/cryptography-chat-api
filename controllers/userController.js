const userService = require('../services/userService');
const yup = require('yup');

const registerSchema = yup.object().shape({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Valid email is required').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters long').required('Password is required'),
});

const loginSchema = yup.object().shape({
    email: yup.string().email('Valid email is required').required('Email is required'),
    password: yup.string().required('Password is required'),
});

async function register(req, res) {
    try {
        await registerSchema.validate(req.body, { abortEarly: false });

        const { name, email, password } = req.body;

        const existingUser = await userService.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).send({ error: 'Email is already registered' });
        }

        await userService.register(name, email, password);
        res.status(201).send({ message: 'User registered successfully' });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).send({ errors: err.errors });
        }
        res.status(500).send({ error: 'Error registering user' });
    }
}

async function login(req, res) {
    try {
        await loginSchema.validate(req.body, { abortEarly: false });

        const { email, password } = req.body;
        const auth = await userService.login(email, password);
        res.status(200).send(auth);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).send({ errors: err.errors });
        }
        res.status(401).send({ error: 'Invalid credentials' });
    }
}

async function getAllUsers(req, res) {
    try {
        const users = await userService.getAllUsers();
        res.status(200).send(users);
    } catch (err) {
        res.status(500).send({ error: 'Error retrieving users' });
    }
}

module.exports = { register, login, getAllUsers };
