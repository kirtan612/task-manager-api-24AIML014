const { sendEmail } = require('../services/emailService');
const { testEmailTemplate } = require('../templates/emailTemplates');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Controller to send a test email.
 * POST /api/test-email
 */
const sendTestEmail = async (req, res) => {
    try {
        const { email, name } = req.body;

        // 1. Missing email validation
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        // 2. Email format validation
        if (!EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        // 3. Generate template
        const { subject, text, html } = testEmailTemplate({
            name: name || 'User',
            email: email.trim(),
        });

        // 4. Send email via reusable service
        const result = await sendEmail({
            to: email.trim(),
            subject,
            text,
            html,
        });

        // 5. Respond with success (safe response, no credentials)
        return res.status(200).json({
            success: true,
            message: 'Test email sent successfully',
            data: {
                recipient: result.to,
                messageId: result.messageId,
            },
        });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: err.message || 'Failed to send test email',
        });
    }
};

module.exports = {
    sendTestEmail,
};
