const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { forgotPasswordTemplate } = require('../templates/emailTemplates');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register a new user
 * POST /auth/register
 */
const register = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Client-supplied role is ignored; normal registration always enforces 'user'
        const user = await User.create({ email, password: hashedPassword, role: 'user' });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { id: user._id, email: user.email, role: user.role }
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }
        next(err);
    }
};

/**
 * Login user and issue JWT
 * POST /auth/login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }

        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const role = user.role || 'user';
        const token = jwt.sign(
            { id: user._id, email: user.email, role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                role
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get authenticated user profile
 * GET /auth/me
 */
const getMe = (req, res) => {
    return res.json({ success: true, data: req.user });
};

/**
 * Forgot password request
 * POST /auth/forgot-password or POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        // 1. Validate email input
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        if (!EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        // Generic response message to prevent email enumeration
        const genericMessage = 'If an account exists with this email, a password reset link has been sent.';

        // 2. If user does not exist, return generic message immediately
        if (!user) {
            return res.status(200).json({
                success: true,
                message: genericMessage
            });
        }

        // 3. Generate cryptographically secure random token (raw token sent in email)
        const rawToken = crypto.randomBytes(32).toString('hex');

        // 4. Hash the token before storing in MongoDB (never store raw token)
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        // 5. Set expiration time to 30 minutes
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();

        // 6. Build reset link and send email using Nodemailer
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password/${rawToken}`;

        const { subject, text, html } = forgotPasswordTemplate({
            name: user.email.split('@')[0],
            resetLink,
            resetToken: rawToken
        });

        try {
            await sendEmail({
                to: user.email,
                subject,
                text,
                html
            });
        } catch (emailErr) {
            console.error('[ForgotPassword] Failed to send email:', emailErr.message);
            // Server error logged safely, still return clean message or error
        }

        return res.status(200).json({
            success: true,
            message: genericMessage
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Reset password using token
 * POST /auth/reset-password/:token or POST /api/auth/reset-password/:token
 */
const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        // 1. Validate token
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Reset token is required'
            });
        }

        // 2. Validate passwords presence
        if (!password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password and confirm password are required'
            });
        }

        // 3. Validate passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // 4. Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // 5. Hash the incoming raw token to look up against MongoDB
        const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

        // 6. Find user by hashed token
        const user = await User.findOne({ resetPasswordToken: hashedToken });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid password reset token'
            });
        }

        // 7. Check if token has expired
        if (!user.resetPasswordExpires || user.resetPasswordExpires.getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'Password reset link has expired.'
            });
        }

        // 8. Hash the new password with bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // 9. Update user password and invalidate reset token (single-use)
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password.'
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword
};
