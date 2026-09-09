import axios from 'axios';

export const sendOtpEmail = async (toEmail, toName, code, purpose) => {
  const subject =
    purpose === 'reset_password' ? 'Sudha Setu password reset code' : 'Verify your Sudha Setu account';

  const body = `<p>Hi ${toName},</p><p>Your code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`;

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { email: process.env.EMAIL_USER, name: 'Sudha Setu' },
        to: [{ email: toEmail, name: toName }],
        subject,
        htmlContent: body,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
  } catch (err) {
    // Log but do NOT throw — the OTP is already persisted in the DB.
    // Registration / password-reset flow should still succeed even if
    // the email provider is temporarily unavailable or misconfigured.
    console.warn(
      `[emailService] Failed to send OTP email to ${toEmail}: ${err.message}`
    );
  }
};

