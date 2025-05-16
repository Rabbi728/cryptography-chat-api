const userService = require('../services/userService');
const yup = require('yup');
const path = require('path');

const registerSchema = yup.object().shape({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Valid email is required').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters long').required('Password is required'),
});

const loginSchema = yup.object().shape({
    email: yup.string().email('Valid email is required').required('Email is required'),
    password: yup.string().required('Password is required'),
});

const updateProfileSchema = yup.object().shape({
    name: yup.string().min(1, 'Name must not be empty').notRequired()
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
        console.log(err);
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

async function searchUser(req, res) {
    try {
        const { q } = req.body;
        const users = await userService.searchUser(q, req.user.id);
        res.status(200).send(users);
    } catch (err) {
        res.status(500).send({ error: 'Error retrieving users' });
    }
}

async function updateProfile(req, res) {
    try {
        await updateProfileSchema.validate(req.body, { abortEarly: false });

        const userId = req.user.id;
        const userData = {};
        
        // Handle profile data (name)
        if (req.body.name) {
            userData.name = req.body.name;
        }
        
        // Handle avatar upload if present
        if (req.file) {
            // Get the relative path for storing in database
            const relativePath = `/uploads/avatars/${path.basename(req.file.path)}`;
            userData.avatar = relativePath;
        }

        // Check if there's any data to update
        if (Object.keys(userData).length === 0) {
            return res.status(400).send({ error: 'No data provided for update' });
        }

        const updatedUser = await userService.updateProfile(userId, userData);
        res.status(200).send({ message: 'Profile updated successfully', user: updatedUser });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).send({ errors: err.errors });
        }
        console.log(err);
        res.status(500).send({ error: 'Error updating profile' });
    }
}

async function getProfile(req, res) {
    try {
        const userId = req.user.id;
        const profile = await userService.getUserProfile(userId);
        res.status(200).send(profile);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error retrieving profile' });
    }
}

module.exports = { register, login, getAllUsers, searchUser, updateProfile, getProfile };
