const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Email Transporter (Configure with your credentials in .env for real emails)
// For now, we will just log the OTP to the console.
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper: Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper: Send OTP
const sendOTP = async (email, otp) => {
    console.log(`\n================================`);
    console.log(`🔐 OTP for ${email}: ${otp}`);
    console.log(`================================\n`);

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Path2Profession Verification Code',
                text: `Your verification code is: ${otp}. It expires in 10 minutes.`
            });
            console.log('📧 Email sent successfully');
        } catch (error) {
            console.error('❌ Email sending failed:', error.message);
        }
    } else {
        console.log('⚠️ Email credentials not found in .env. OTP logged to console only.');
    }
};

// @route   POST api/auth/register
// @desc    Register user & Send OTP
// @access  Public
router.post('/register', async (req, res) => {
    const { email, password, displayName } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create new user
        user = new User({
            displayName,
            email,
            password,
            isVerified: true // Auto-verify since we removed OTP
        });

        await user.save();

        // Generate Token immediately
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: { id: user.id, email: user.email, displayName: user.displayName }
            });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & Send OTP (2FA)
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Generate Token immediately
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: { id: user.id, email: user.email, displayName: user.displayName }
            });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP and return Token
// @access  Public
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid request' });
        }

        // Check if OTP matches and is not expired
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired Code' });
        }

        // Verify user and clear OTP
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/user
// @desc    Get logged in user
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
});

// @route   GET api/auth/config
// @desc    Get public configuration (Google Client ID)
// @access  Public
router.get('/config', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : null;
    res.json({
        googleClientId: clientId
    });
});

const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : '';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// @route   POST api/auth/google
// @desc    Authenticate with Google
// @access  Public
router.post('/google', async (req, res) => {
    const { idToken } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID
        });

        const { sub: googleId, email, name: displayName, picture } = ticket.getPayload();

        let user = await User.findOne({
            $or: [
                { googleId: googleId },
                { email: email }
            ]
        });

        if (user) {
            // Update user with googleId if they signed up with email previously
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // Create new user for first-time Google sign-in
            user = new User({
                email,
                displayName,
                googleId,
                isVerified: true
            });
            await user.save();
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: { id: user.id, email: user.email, displayName: user.displayName, picture }
            });
        });

    } catch (err) {
        console.error('Google Auth Security Error:', {
            message: err.message,
            stack: err.stack,
            audienceUsed: GOOGLE_CLIENT_ID
        });
        res.status(401).json({
            message: 'Token verification failed',
            details: err.message
        });
    }
});

module.exports = router;
