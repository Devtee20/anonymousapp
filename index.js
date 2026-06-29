require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cors = require('cors');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// Configure CORS: support a comma-separated `FRONTEND_ORIGIN` list or allow
// any origin in development. When credentials are enabled we must echo the
// request origin (not use '*') and add `Vary: Origin` so caches behave.
const allowedOrigins = process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
    : null;

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (!allowedOrigins) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS policy: origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
};

// Add Vary header to responses so caches/keying respect the Origin header.
app.use((req, res, next) => {
    res.header('Vary', 'Origin');
    next();
});

app.use(cors(corsOptions));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api', (req, res) => {
    res.json({ status: 'backend is running' });
});

app.use(notFoundHandler);
app.use(errorHandler);


const start = async () => {
    const mongoUri = process.env.MongoDB_URI || process.env.MongoDB_URI || process.env.MONGO_URI;
    try {
        if (mongoUri && typeof mongoUri === 'string') {
            try {
                await mongoose.connect(mongoUri, {});
                console.log('Connected to MongoDB');
            } catch (err) {
                // If the parse error is caused by a missing scheme, try a tolerant retry
                const needsScheme = !/^mongodb(?:\+srv)?:\/\//i.test(mongoUri);
                if (needsScheme) {
                    const tryUri = 'mongodb+srv://' + mongoUri;
                    try {
                        await mongoose.connect(tryUri, {});
                        console.log('Connected to MongoDB (auto-added mongodb+srv://)');
                    } catch (err2) {
                        console.error('Failed to connect to MongoDB after adding scheme. Please set a valid MongoDB connection string environment variable starting with "mongodb://" or "mongodb+srv://".');
                        console.error(err2.message);
                    }
                } else {
                    console.error('Failed to connect to MongoDB:', err.message);
                }
            }
        } else {
            console.warn('No MongoDB URI provided. Running without database (in-memory mode).');
        }

        const authService = require('./services/authService');
        await authService.ensureSuperAdmin();

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Unexpected error while initializing server', error);
        const authService = require('./services/authService');
        await authService.ensureSuperAdmin();

        app.listen(port, () => {
            console.log(`Server running on port ${port} (DB unavailable)`);
        });
    }
}

start();

// IBDswk3ItBRMUsHk
// familusibisola20_db_user