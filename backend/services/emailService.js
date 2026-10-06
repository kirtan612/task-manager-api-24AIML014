const nodemailer = require('nodemailer');

/**
 * Creates and configures the Nodemailer transporter using environment variables.
 */
const createTransporter = () => {
    const port = Number(process.env.MAIL_PORT) || 587;
    const isSecure = port === 465;
    const host = (process.env.MAIL_HOST || 'smtp.gmail.com').toLowerCase();
    const isGmail = host.includes('gmail') || process.env.MAIL_SERVICE === 'gmail';

    const config = isGmail
        ? {
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        }
        : {
            host: process.env.MAIL_HOST || 'smtp.gmail.com',
            port,
            secure: isSecure,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
        };

    return nodemailer.createTransport(config);
};

let transporter = createTransporter();

const getTransporter = () => {
    // Refresh transporter if env changed
    transporter = createTransporter();
    return transporter;
};

/**
 * Reusable function to send an email.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Subject line
 * @param {string} [params.text] - Plain-text body
 * @param {string} [params.html] - HTML body
 * @returns {Promise<Object>} - Delivery info { success: true, messageId, to }
 */
const sendEmail = async ({ to, subject, text, html }) => {
    if (!to) {
        throw new Error('Recipient email (to) is required');
    }
    if (!subject) {
        throw new Error('Email subject is required');
    }

    const mailOptions = {
        from: process.env.MAIL_FROM || process.env.MAIL_USER,
        to,
        subject,
        text,
        html,
    };

    try {
        const activeTransporter = getTransporter();
        const info = await activeTransporter.sendMail(mailOptions);
        return {
            success: true,
            messageId: info.messageId,
            to,
        };
    } catch (err) {
        // Log safe diagnostic information without leaking passwords or sensitive tokens
        console.error(`[EmailService Error] Failed to send email to ${to}: ${err.message}`);
        
        // Return a clean error without exposing credentials or internal connection strings
        const safeError = new Error('Failed to send email. Please check SMTP configuration.');
        safeError.statusCode = 500;
        safeError.originalError = err.message;
        throw safeError;
    }
};

/**
 * Startup check to verify SMTP connectivity without blocking or crashing the application.
 */
const verifyEmailService = async () => {
    // Only attempt verification if credentials exist
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
        console.log('[EmailService] Notice: SMTP credentials not fully configured in .env. Server remains operational.');
        return false;
    }

    try {
        const activeTransporter = getTransporter();
        await activeTransporter.verify();
        console.log('[EmailService] Ready: SMTP server connection successfully verified.');
        return true;
    } catch (err) {
        console.warn(`[EmailService Warning] SMTP connection could not be established: ${err.message}. Server remains operational.`);
        return false;
    }
};

module.exports = {
    transporter,
    getTransporter,
    sendEmail,
    verifyEmailService,
};
