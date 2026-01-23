const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Blacklist = require('../models/Blacklist');

const protect = async (req, res, next) => {
    let token;

    // Check for token in cookies first
    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    } 
    // Then check Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    console.log('Auth check - Cookie:', !!req.cookies.jwt, 'Header:', !!req.headers.authorization);

    if (token) {
        try {
            const blacklisted = await Blacklist.findOne({ token });
            if (blacklisted) {
                res.status(401);
                throw new Error('Not authorized, token revoked');
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.userId).select('-password');
            next();
        } catch (error) {
            console.log('Token verification failed:', error.message);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        console.log('No token found in cookies or headers');
        res.status(401);
        throw new Error('Not authorized, no token');
    }
};

const optionalAuth = async (req, res, next) => {
    let token;

    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const blacklisted = await Blacklist.findOne({ token });
            if (!blacklisted) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findById(decoded.userId).select('-password');
            }
        } catch (error) {
            // Silently fail for optional auth
        }
    }
    next();
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401);
        throw new Error('Not authorized as an admin');
    }
};

module.exports = { protect, optionalAuth, admin };
