const axios = require("axios");

// ═══════════════════════════════════════════════════════════════
// LEARNLOG EMAIL SERVICE - BREVO API
// ═══════════════════════════════════════════════════════════════

const APP_NAME = process.env.APP_NAME || "LearnLog";

// Check if Brevo is configured
if (!process.env.BREVO_API_KEY) {
  console.error("❌ BREVO_API_KEY is not set in environment variables");
  console.warn("⚠️  Email service will not work. Please add BREVO_API_KEY to .env");
  console.warn("⚠️  Get your API key from: https://app.brevo.com/settings/keys/api");
  console.log("");
} else if (!process.env.BREVO_EMAIL) {
  console.error("❌ BREVO_EMAIL is not set in environment variables");
  console.warn("⚠️  Email service will not work. Please add BREVO_EMAIL to .env");
  console.log("");
} else {
  console.log("✅ BREVO_API_KEY configured");
  console.log("✅ BREVO_EMAIL configured:", process.env.BREVO_EMAIL);
  console.log("✅ Brevo email service is ready");
  console.log("📧 Service: Brevo SMTP API");
  console.log("🏢 Brand: " + APP_NAME);
  console.log("");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  ✅ Email Service Ready - All Systems Go!                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
}

// ═══════════════════════════════════════════════════════════════
// BREVO API EMAIL SENDER
// ═══════════════════════════════════════════════════════════════

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                  📧 SENDING EMAIL                          ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log("📧 [" + APP_NAME + "] Email Details:");
    console.log("   ├─ To: " + to);
    console.log("   ├─ Subject: " + subject);
    console.log("   ├─ From: " + APP_NAME + " <" + process.env.BREVO_EMAIL + ">");
    console.log("   ├─ Service: Brevo SMTP API");
    console.log("   └─ Status: Sending...");
    console.log("");
    
    const res = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: APP_NAME,
          email: process.env.BREVO_EMAIL, // verified sender
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ [" + APP_NAME + "] Email sent successfully!");
    console.log("   ├─ Message ID: " + (res.data?.messageId || 'N/A'));
    console.log("   ├─ Status: Delivered");
    console.log("   ├─ Recipient: " + to);
    console.log("   └─ Subject: " + subject);
    console.log("");
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║  ✅ Email Sent Successfully                               ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");
    
    return res.data;
  } catch (err) {
    console.error("\n╔════════════════════════════════════════════════════════════╗");
    console.error("║                  ❌ EMAIL SENDING FAILED                  ║");
    console.error("╚════════════════════════════════════════════════════════════╝");
    console.error("");
    console.error("❌ [" + APP_NAME + "] Email sending failed!");
    console.error("   ├─ To: " + to);
    console.error("   ├─ Subject: " + subject);
    console.error("   ├─ Error: " + (err.response?.data?.message || err.message));
    console.error("   ├─ Status Code: " + (err.response?.status || 'N/A'));
    console.error("   └─ Details: " + JSON.stringify(err.response?.data, null, 2));
    console.error("");
    console.error("╔════════════════════════════════════════════════════════════╗");
    console.error("║  ❌ Email Failed - Check Configuration                    ║");
    console.error("╚════════════════════════════════════════════════════════════╝\n");
    throw err;
  }
};

// ═══════════════════════════════════════════════════════════════
// OTP EMAIL SENDER
// ═══════════════════════════════════════════════════════════════

/**
 * Send OTP verification email
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} username - User's name
 * @returns {Promise<object>} Email sending result
 */
const sendOTPEmail = async (to, otp, username) => {
  const subject = `Your ${APP_NAME} Verification Code`;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 16px; text-align: center;">
              <h1 style="margin: 0; color: #18181b; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">${APP_NAME}</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 16px 40px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px; font-weight: 600; text-align: center;">Verification Code</h2>
              
              <p style="margin: 0 0 24px 0; color: #52525b; font-size: 15px; line-height: 1.6; text-align: center;">
                Hi <strong>${username}</strong>,<br>Here is your verification code to access your learning journal.
              </p>
              
              <!-- OTP Display -->
              <div style="background-color: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 32px 0;">
                <div style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #18181b; font-family: 'Courier New', ui-monospace, monospace; margin-left: 12px;">
                  ${otp}
                </div>
              </div>
              
              <!-- Information -->
              <p style="margin: 0 0 16px 0; color: #71717a; font-size: 14px; line-height: 1.5; text-align: center;">
                This code will expire in <strong>5 minutes</strong>. Please do not share this code with anyone.
              </p>
              
              <p style="margin: 0; color: #a1a1aa; font-size: 13px; line-height: 1.5; text-align: center;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 8px 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                This is an automated message, please do not reply.
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  
  return await sendEmail({ to, subject, html });
};

// ═══════════════════════════════════════════════════════════════
// WELCOME EMAIL SENDER
// ═══════════════════════════════════════════════════════════════

/**
 * Send welcome email to new user
 * @param {string} to - Recipient email address
 * @param {string} username - User's name
 * @returns {Promise<object>} Email sending result
 */
const sendWelcomeEmail = async (to, username) => {
  const subject = `Welcome to ${APP_NAME}!`;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 16px; text-align: center;">
              <h1 style="margin: 0; color: #18181b; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">${APP_NAME}</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 16px 40px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 22px; font-weight: 600; text-align: center;">Welcome to the family!</h2>
              
              <p style="margin: 0 0 24px 0; color: #52525b; font-size: 15px; line-height: 1.6; text-align: center;">
                Hi <strong>${username}</strong>,<br>Your account has been created successfully. Start tracking your learning journey today!
              </p>
              
              <!-- Account Details Box -->
              <div style="background-color: #f4f4f5; border-radius: 12px; padding: 24px; margin: 0 0 32px 0;">
                <h3 style="margin: 0 0 16px 0; color: #18181b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Account Details</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #71717a; font-size: 14px;">Email</td>
                    <td style="padding: 6px 0; color: #18181b; font-size: 14px; text-align: right; font-weight: 500;">${to}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #71717a; font-size: 14px;">Name</td>
                    <td style="padding: 6px 0; color: #18181b; font-size: 14px; text-align: right; font-weight: 500;">${username}</td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 0 0 24px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                  Start Learning Now
                </a>
              </div>
              
              <!-- Next Steps -->
              <p style="margin: 0 0 8px 0; color: #52525b; font-size: 14px; line-height: 1.6; text-align: center;">
                Track your study hours, create journal entries, and monitor your learning progress all in one place.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 8px 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                This is an automated message, please do not reply.
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  
  return await sendEmail({ to, subject, html });
};

// ═══════════════════════════════════════════════════════════════
// PASSWORD RESET EMAIL SENDER
// ═══════════════════════════════════════════════════════════════

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetToken - Password reset token
 * @param {string} username - User's name
 * @returns {Promise<object>} Email sending result
 */
const sendPasswordResetEmail = async (to, resetToken, username) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  const subject = `Reset Your ${APP_NAME} Password`;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 16px; text-align: center;">
              <h1 style="margin: 0; color: #18181b; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">${APP_NAME}</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 16px 40px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px; font-weight: 600; text-align: center;">Reset Your Password</h2>
              
              <p style="margin: 0 0 24px 0; color: #52525b; font-size: 15px; line-height: 1.6; text-align: center;">
                Hi <strong>${username}</strong>,<br>We received a request to reset your password. Click the button below to create a new password.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 0 0 24px 0;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                  Reset Password
                </a>
              </div>
              
              <!-- Alternative Link -->
              <div style="background-color: #f4f4f5; border-radius: 12px; padding: 16px; margin: 0 0 24px 0;">
                <p style="margin: 0 0 8px 0; color: #71717a; font-size: 13px; text-align: center;">
                  Or copy and paste this link in your browser:
                </p>
                <p style="margin: 0; color: #18181b; font-size: 12px; word-break: break-all; text-align: center; font-family: 'Courier New', monospace;">
                  ${resetUrl}
                </p>
              </div>
              
              <!-- Warning -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 0 0 24px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⏱️ Important:</strong> This link will expire in <strong>15 minutes</strong> for security reasons.
                </p>
              </div>
              
              <p style="margin: 0; color: #a1a1aa; font-size: 13px; line-height: 1.6; text-align: center;">
                If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 8px 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                This is an automated message, please do not reply.
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  
  return await sendEmail({ to, subject, html });
};

module.exports = { sendEmail, sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail };