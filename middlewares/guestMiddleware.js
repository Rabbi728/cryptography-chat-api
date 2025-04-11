const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_key';

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            jwt.verify(token, JWT_SECRET);
            return res.status(403).send({ error: 'Access denied for authenticated users' });
        } catch (err) {
            // Token is invalid or expired, proceed as guest
        }
    }
    next();
};
