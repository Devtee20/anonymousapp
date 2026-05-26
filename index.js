require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const corsMiddleware = require('./middleware/corsMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

app.get('/api', (req, res) => {
    res.json({ status: 'backend is running' });
});

app.use(notFoundHandler);
app.use(errorHandler);


const start = async () => {
    try {
        await mongoose.connect(process.env.MongoDB_URI, {});
        console.log('Connected to MongoDB');
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
    }
}

start();

// IBDswk3ItBRMUsHk
// familusibisola20_db_user