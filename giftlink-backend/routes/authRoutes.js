const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const connectToDatabase = require('../models/db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

function createToken(user) {
    return jwt.sign(
        {
            id: user._id ? user._id.toString() : user.email,
            email: user.email,
            name: user.name
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

function validateRequest(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    next();
}

router.post(
    '/register',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').trim().isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const db = await connectToDatabase();
            const users = db.collection('users');

            const name = req.body.name.trim();
            const email = req.body.email.trim().toLowerCase();
            const password = req.body.password;

            const existingUser = await users.findOne({ email });

            if (existingUser) {
                return res.status(409).json({
                    message: 'User already exists'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const result = await users.insertOne({
                name,
                email,
                password: hashedPassword,
                createdAt: new Date()
            });

            const user = {
                id: result.insertedId.toString(),
                name,
                email
            };

            res.status(201).json({
                message: 'User registered successfully',
                user,
                token: createToken({
                    _id: result.insertedId,
                    name,
                    email
                })
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    '/login',
    [
        body('email').trim().isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const db = await connectToDatabase();
            const users = db.collection('users');

            const email = req.body.email.trim().toLowerCase();
            const password = req.body.password;

            const user = await users.findOne({ email });

            if (!user) {
                return res.status(401).json({
                    message: 'Invalid email or password'
                });
            }

            const passwordMatches = await bcrypt.compare(password, user.password);

            if (!passwordMatches) {
                return res.status(401).json({
                    message: 'Invalid email or password'
                });
            }

            res.json({
                message: 'Login successful',
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email
                },
                token: createToken(user)
            });
        } catch (error) {
            next(error);
        }
    }
);

router.put('/update', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Authorization token required'
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);

        const db = await connectToDatabase();
        const users = db.collection('users');

        const updateData = {};

        if (req.body.name && req.body.name.trim() !== '') {
            updateData.name = req.body.name.trim();
        }

        const result = await users.updateOne(
            { email: decoded.email },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const updatedUser = await users.findOne(
            { email: decoded.email },
            { projection: { password: 0 } }
        );

        res.json({
            message: 'User information updated successfully',
            user: updatedUser
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Invalid or expired token'
            });
        }

        next(error);
    }
});

module.exports = router;
