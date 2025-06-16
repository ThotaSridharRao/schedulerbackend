// schedule-master-backend/utils/emailService.js
const sgMail = require('@sendgrid/mail');

// Set SendGrid API Key using the environment variable
// process.env.SENDGRID_API_KEY will be available because dotenv.config() is called in server.js
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends a task due notification email to the user.
 * @param {string} userEmail - The recipient's email address.
 * @param {string} taskName - The name of the task.
 * @param {Date} dueDate - The due date of the task (Date object).
 * @param {string} dueTime - The due time of the task (e.g., "HH:MM").
 */
const sendTaskDueNotification = async (userEmail, taskName, dueDate, dueTime) => {
    // Basic validation for essential parameters
    if (!userEmail || !taskName || !dueDate || !dueTime) {
        console.error("Missing required email notification parameters. Cannot send email.");
        return;
    }

    // Ensure the sender email is configured
    const senderEmail = process.env.SENDGRID_SENDER_EMAIL;
    if (!senderEmail) {
        console.error("SENDGRID_SENDER_EMAIL is not configured in environment variables. Cannot send email.");
        return;
    }

    const msg = {
        to: userEmail, // User's email address (recipient)
        from: senderEmail, // Your verified sender email (from your .env)
        subject: `🔔 Reminder: Your task "${taskName}" is due soon!`, // Email subject line
        html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <h2 style="color: #4F46E5; text-align: center; font-size: 24px; margin-bottom: 20px;">Schedule Master Reminder</h2>
                <p style="font-size: 16px; color: #334155; line-height: 1.5;">Hi there,</p>
                <p style="font-size: 16px; color: #334155; line-height: 1.5;">Just a friendly reminder that your task is approaching its deadline:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #818CF8; margin: 20px 0; border-radius: 4px;">
                    <h3 style="color: #1a202c; font-size: 20px; margin-top: 0; margin-bottom: 10px;">Task: ${taskName}</h3>
                    <p style="font-size: 14px; color: #64748b; margin-bottom: 5px;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p style="font-size: 14px; color: #64748b; margin-bottom: 0;"><strong>Due Time:</strong> ${dueTime}</p>
                </div>
                <p style="font-size: 16px; color: #334155; line-height: 1.5;">Please log in to <a href="https://scheduler-pkxg.onrender.com" style="color: #4F46E5; text-decoration: none;">Schedule Master</a> to manage your tasks.</p>
                <p style="font-size: 16px; color: #334155; line-height: 1.5; margin-top: 30px;">Best regards,<br>The Schedule Master Team</p>
                <hr style="border-top: 1px solid #e2e8f0; margin-top: 30px;">
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">This is an automated message, please do not reply.</p>
            </div>
        `,
    };

    try {
        await sgMail.send(msg);
        console.log(`Email notification sent to ${userEmail} for task "${taskName}"`);
    } catch (error) {
        console.error(`Error sending email to ${userEmail} for task "${taskName}":`, error.response ? error.response.body : error);
        // Log more detailed error if available from SendGrid
        if (error.response && error.response.body && error.response.body.errors) {
            console.error("SendGrid API Errors:", error.response.body.errors);
        }
    }
};

module.exports = { sendTaskDueNotification };
