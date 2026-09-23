require('dotenv').config();
const express = require('express');
const logger = require('./logger');
const expressPinoLogger = require('express-pino-logger');
const natural = require('natural');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(expressPinoLogger({ logger }));

app.post('/sentiment', (req, res) => {
    try {
        const sentence = req.body.sentence;
        if (Boolean(sentence) === false) {
            return res.status(400).json({ message: 'sentence is required' });
        }
        const Analyzer = natural.SentimentAnalyzer;
        const stemmer = natural.PorterStemmer;
        const analyzer = new Analyzer('English', stemmer, 'afinn');
        const sentimentScore = analyzer.getSentiment(sentence.split(/\s+/));
        let sentiment = 'neutral';
        if (sentimentScore > 0) {
            sentiment = 'positive';
        } else if (sentimentScore < 0) {
            sentiment = 'negative';
        }
        res.status(200).json({ sentimentScore, sentiment });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/', (req, res) => {
    res.json({ message: 'GiftLink Sentiment API is running' });
});

if (require.main === module) {
    app.listen(port, () => {
        logger.info(`Sentiment server running on port ${port}`);
    });
}

module.exports = app;
