const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./db/db');
const config = require('./config/config');

// NEW IMPORTS FOR NOTIFICATIONS
const Task = require('./models/Task'); // Import Task model to query tasks
const User = require('./models/User'); // Import User model to get user email for notifications
const { sendTaskDueNotification } = require('./utils/emailService'); // Import email service utility
const cron = require('node-cron'); // For scheduling cron jobs
const moment = require('moment-timezone'); // For robust date/time handling across timezones

// Load env vars (IMPORTANT: This needs to be called early to load all process.env variables)
dotenv.config({ path: './.env' });

// Connect to database
connectDB();

const app = express();

// CORS Middleware (ensure this is correctly configured for your frontend URL)
app.use(cors({
  origin: 'https://scheduler-pkxg.onrender.com' // Your frontend URL
}));

app.use(express.json()); // Body parser for JSON data

// --- Task Notification Scheduler ---
// This job will run every 15 minutes to check for tasks due soon.
// The cron string '*/15 * * * *' means "at every 15th minute" (e.g., 0, 15, 30, 45 past the hour).
// You can adjust this schedule based on how frequently you want to check for tasks.
// For example: '*/5 * * * *' for every 5 minutes, or '0 9 * * *' for 9 AM daily.
cron.schedule('*/15 * * * *', async () => {
    console.log('Running scheduled task notification check...');
    try {
        // IMPORTANT: Define the timezone for task due dates and comparisons.
        // This should ideally be configurable per user or based on your primary user base.
        // "Asia/Kolkata" is used as an example based on your location.
        // CHANGE THIS if your app's primary timezone or user's timezone is different.
        const appTimezone = "Asia/Kolkata";

        const now = moment().tz(appTimezone);

        // Define a "notification window" to identify tasks that are "due soon".
        // This example checks for tasks due from 15 minutes in the past up to 30 minutes in the future.
        // This range helps catch tasks that are just due, or slightly past due but not yet notified.
        const notificationWindowStart = now.clone().subtract(15, 'minutes');
        const notificationWindowEnd = now.clone().add(30, 'minutes');

        // Find tasks that meet all the following criteria:
        // 1. `status` is 'pending' (task not yet completed)
        // 2. `notified` flag is `false` (notification hasn't been sent for this task yet)
        // 3. `dueDate` falls within the relevant date range (today or spanning into tomorrow if window crosses midnight)
        const tasksToNotify = await Task.find({
            status: 'pending',
            notified: false,
            // Query by date part only for efficiency, then filter by exact time in loop
            dueDate: {
                $gte: notificationWindowStart.startOf('day').toDate(), // From the start of the current day (in appTimezone)
                $lte: notificationWindowEnd.endOf('day').toDate()     // Up to the end of the day relevant to the window
            }
        }).populate('userId', 'email'); // Populate `userId` to directly get the associated `User` object, including their `email`

        for (const task of tasksToNotify) {
            // Construct the full due datetime for the task, localized to `appTimezone`.
            // We combine the date part from `task.dueDate` (which is a Date object)
            // and the time string from `task.dueTime` (e.g., "17:00").
            const taskDueDateFormatted = moment(task.dueDate).tz(appTimezone).format('YYYY-MM-DD');
            const taskDueDateTime = moment(`${taskDueDateFormatted}T${task.dueTime}`).tz(appTimezone);

            // Check if the task's calculated due datetime falls precisely within our dynamic notification window.
            // `isBetween(start, end, units, inclusivity)`: '[]' means inclusive of start and end.
            if (taskDueDateTime.isBetween(notificationWindowStart, notificationWindowEnd, undefined, '[]')) {
                // Ensure we have a user and their email before attempting to send
                if (task.userId && task.userId.email) {
                    console.log(`Preparing to send notification for task "${task.name}" to ${task.userId.email}`);
                    await sendTaskDueNotification(
                        task.userId.email,
                        task.name,
                        task.dueDate, // Pass the original Date object for flexible formatting in emailService
                        task.dueTime
                    );
                    // After successfully sending the notification, mark the task as notified
                    await Task.findByIdAndUpdate(task._id, { notified: true });
                    console.log(`Notification sent and task ${task._id} marked as notified.`);
                } else {
                    console.warn(`User email not found for task "${task.name}" (Task ID: ${task._id}). Skipping notification.`);
                }
            }
        }
        console.log('Scheduled task notification check finished successfully.');
    } catch (error) {
        console.error('Error during scheduled task notification:', error);
        // Provide more detailed error logging for debugging
        if (error.code) { // Mongoose/Mongo errors often have a 'code' (e.g., 'ECONNREFUSED' for DB connection)
            console.error('Database/Mongoose error code:', error.code);
        }
        if (error.message) {
            console.error('Error message:', error.message);
        }
        // If SendGrid error, it usually logs details within sendTaskDueNotification already
    }
});
// -----------------------------------

// Import routes (keep these after middleware and cron setup)
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
