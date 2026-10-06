/**
 * Email Templates Module
 * Separates email HTML and plain-text presentation from business logic.
 */

/**
 * Template for testing Nodemailer functionality
 * @param {Object} options - Options containing recipient name or email
 * @returns {Object} - { subject, text, html }
 */
const testEmailTemplate = ({ name = 'User', email = '' } = {}) => {
    const displayName = name !== 'User' ? name : (email ? email.split('@')[0] : 'User');
    const subject = 'Test Email';
    const text = `Hello ${displayName},\n\nThis is a test email from our application.\n\nRegards,\nApplication Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .header { font-size: 20px; font-weight: 700; color: #4f46e5; margin-bottom: 16px; }
    .content { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .badge { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
    .footer { font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">Task Manager Application</div>
    <div class="badge">Nodemailer Test</div>
    <div class="content">
      <p>Hello <strong>${displayName}</strong>,</p>
      <p>This is a test email from our application to verify that the email notification service is working properly.</p>
      <p>If you received this message, your SMTP configuration is verified and fully operational.</p>
    </div>
    <div class="footer">
      Regards,<br>
      <strong>Application Team</strong>
    </div>
  </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
};

/**
 * Pre-configured template for upcoming Forgot Password feature
 * @param {Object} options - { name, resetLink, resetToken }
 * @returns {Object} - { subject, text, html }
 */
const forgotPasswordTemplate = ({ name = 'User', resetLink = '#', resetToken = '' } = {}) => {
    const subject = 'Reset Your Password';
    const text = `Hello ${name},\n\nYou requested a password reset.\n\nClick the link below to create a new password:\n${resetLink}\n\nThis link expires in 30 minutes.\n\nIf you did not request this password reset, you can safely ignore this email.\n\nRegards,\nApplication Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .header { font-size: 20px; font-weight: 700; color: #4f46e5; margin-bottom: 16px; }
    .content { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .token-box { background: #f1f5f9; padding: 10px 14px; border-radius: 6px; font-family: monospace; font-size: 14px; color: #0f172a; margin: 10px 0; word-break: break-all; }
    .footer { font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">Task Manager Application</div>
    <div class="content">
      <p>Hello <strong>${name}</strong>,</p>
      <p>You requested a password reset.</p>
      <p>Click the button below to create a new password:</p>
      <p><a href="${resetLink}" class="btn" target="_blank">Reset Password</a></p>
      <p>Or paste this link into your browser:</p>
      <p class="token-box">${resetLink}</p>
      <p style="color: #64748b; font-size: 13px;"><strong>Note:</strong> This link expires in 30 minutes.</p>
      <p style="color: #64748b; font-size: 13px;">If you did not request this password reset, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      Regards,<br>
      <strong>Application Team</strong>
    </div>
  </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
};

module.exports = {
    testEmailTemplate,
    forgotPasswordTemplate
};
