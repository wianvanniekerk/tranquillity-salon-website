const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { config } = require('../config/db.config');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.tranquillitysalon.co.za',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

async function sendAppointmentReminders() {
    try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const formattedNow = now.toISOString().slice(0, 19).replace('T', ' ');
        const formattedTomorrow = tomorrow.toISOString().slice(0, 19).replace('T', ' ');

        const [appointments] = await new Promise((resolve, reject) => {
            config.query(`
                SELECT a.AppointmentID, c.Email, c.FirstName, a.AppointmentDate
                FROM Appointment a
                JOIN Client c ON a.ClientID = c.ClientID
                WHERE a.AppointmentDate BETWEEN ? AND ?
                AND a.ReminderSent = 0
            `, [formattedNow, formattedTomorrow], (error, results) => {
                if (error) return reject(error);
                resolve([results]);
            });
        });

        for (const appointment of appointments) {
            const mailOptions = {
                from: '"Tranquillity Salon" <admin@tranquillitysalon.co.za>',
                to: appointment.Email,
                subject: 'Appointment Reminder - Tranquillity Salon',
                text: `Dear ${appointment.FirstName},
            
            This is a friendly reminder that you have an appointment scheduled at Tranquillity Salon on ${new Date(appointment.AppointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date(appointment.AppointmentDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.
            
            If you need to reschedule or have any questions, please contact us at 083 260 0148.
            
            We look forward to seeing you!
            
            Best regards,
            Tranquillity Salon`,
                html: `<!DOCTYPE html>
                <!-- (rest of the HTML content) -->
                </html>`
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`Reminder sent for appointment ${appointment.AppointmentID}`);

                await new Promise((resolve, reject) => {
                    config.query(`
                        UPDATE Appointment
                        SET ReminderSent = 1
                        WHERE AppointmentID = ?
                    `, [appointment.AppointmentID], (error) => {
                        if (error) return reject(error);
                        resolve();
                    });
                });

                console.log(`Appointment ${appointment.AppointmentID} marked as reminded in the database`);
            } catch (error) {
                console.error(`Error processing appointment ${appointment.AppointmentID}:`, error);
            }
        }

        console.log('Appointment reminders processed.');
    } catch (err) {
        console.error('Error processing appointment reminders:', err);
    }
}

function startAppointmentReminders() {
    cron.schedule('* * * * *', () => {
        console.log('Running the appointment reminder task');
        sendAppointmentReminders();
    });
}

module.exports = {
    startAppointmentReminders,
    sendAppointmentReminders
};
