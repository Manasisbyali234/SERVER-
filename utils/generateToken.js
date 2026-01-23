const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
    const token = jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    // More permissive cookie settings for production cross-origin
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: true, // Always use secure in production
        sameSite: 'none', // Required for cross-origin cookies
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined
    });
    
    return token;
};

module.exports = generateToken;
