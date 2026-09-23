require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');
const logger = require('./logger');
const connectToDatabase = require('./models/db');
const giftRoutes = require('./routes/giftRoutes');
const searchRoutes = require('./routes/searchRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 3060;

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/api/gifts', giftRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'GiftLink API is running',
        endpoints: ['/api/gifts', '/api/search', '/api/auth/register', '/api/auth/login', '/api/auth/update']
    });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
});

if (require.main === module) {
    connectToDatabase()
        .then(() => {
            logger.info('Connected to DB');
            app.listen(port, () => {
                logger.info(`Server running on port ${port}`);
            });
        })
        .catch((error) => {
            logger.error(error);
            process.exit(1);
        });
}

module.exports = app;
