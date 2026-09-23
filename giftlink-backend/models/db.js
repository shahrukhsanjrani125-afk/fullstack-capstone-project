require('dotenv').config();
const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URL;
let dbInstance = null;

const dbName = 'giftdb';

async function connectToDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    if (!url) {
        throw new Error('MONGO_URL is not configured');
    }

    const client = new MongoClient(url);

    await client.connect();
    dbInstance = client.db(dbName);

    return dbInstance;
}

module.exports = connectToDatabase;
