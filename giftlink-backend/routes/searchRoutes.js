const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');

router.get('/', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('gifts');

        const query = {};

        if (req.query.name && req.query.name.trim() !== '') {
            query.name = {
                $regex: req.query.name.trim(),
                $options: 'i'
            };
        }

        if (req.query.category && req.query.category.trim() !== '') {
            query.category = {
                $regex: `^${req.query.category.trim()}$`,
                $options: 'i'
            };
        }

        if (req.query.condition && req.query.condition.trim() !== '') {
            query.condition = {
                $regex: `^${req.query.condition.trim()}$`,
                $options: 'i'
            };
        }

        if (req.query.age_years !== undefined && req.query.age_years !== '') {
            const age = Number(req.query.age_years);

            if (!Number.isNaN(age)) {
                query.age_years = { $lte: age };
            }
        }

        const gifts = await collection.find(query).toArray();

        res.json(gifts);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
