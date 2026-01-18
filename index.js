const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const helmet = require('helmet');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: false,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Robust CORS Configuration
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://client-jet-ten-12.vercel.app'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logging middleware
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`${req.method} ${req.url}`);
    }
    next();
});

const initializeAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            await User.create({
                name: 'Admin User',
                email: 'admin@rbnews.com',
                password: 'password123',
                role: 'admin',
            });
            console.log('Default admin created: admin@rbnews.com / password123');
        }
    } catch (error) {
        console.error('Error initializing admin:', error.message);
    }
};

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const staticPath = path.join(__dirname, '../client/dist');
    app.use(express.static(staticPath));
    
    // Handle client-side routing - send index.html for all non-API routes
    app.use((req, res, next) => {
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path.join(staticPath, 'index.html'));
        } else {
            next();
        }
    });
}

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Error Middleware:", err);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const startServer = async () => {
    // Validate critical env variables
    const requiredEnv = ['JWT_SECRET', 'MONGO_URI', 'NEWS_API_KEY'];
    for (const env of requiredEnv) {
        if (!process.env[env]) {
            console.error(`CRITICAL ERROR: ${env} is not defined in .env file`);
            process.exit(1);
        }
    }

    try {
        await connectDB();
        await initializeAdmin();
        app.listen(port, () => console.log(`Server started on port ${port}`));
    } catch (error) {
        console.error(`Error starting server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
