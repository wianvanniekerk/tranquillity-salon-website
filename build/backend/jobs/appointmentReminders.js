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
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Appointment Reminder - Tranquillity Salon</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
                    <tr>
                        <td style="padding: 20px 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background-color: #0d9488; padding: 20px 40px; text-align: center;">
                                        <img src="https://res.cloudinary.com/daiaxqvvr/image/upload/v1721458782/tranquility-logo_exggpt.png" alt="Tranquillity Salon" style="max-width: 200px; height: auto;">
                                    </td>
                                </tr>
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">Appointment Reminder</h1>
                                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Dear ${appointment.FirstName},</p>
                                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This is a friendly reminder that you have an appointment scheduled at Tranquillity Salon:</p>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; background-color: #f0f9f8; border-radius: 8px; padding: 20px;">
                                            <tr>
                                                <td>
                                                    <p style="font-size: 18px; font-weight: bold; margin: 0;">Date: ${new Date(appointment.AppointmentDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                    <p style="font-size: 18px; font-weight: bold; margin: 10px 0 0;">Time: ${new Date(new Date(appointment.AppointmentDate).getTime() - 2 * 60 * 60 * 1000).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })}</p>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="font-size: 16px; line-height: 1.5; margin-top: 20px;">If you need to reschedule or have any questions, please contact us at (083) 260-0148.</p>
                                        <p style="font-size: 16px; line-height: 1.5;">We look forward to seeing you!</p>
                                    </td>
                                </tr>
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f3f4f6; padding: 20px 40px; text-align: center;">
                                        <p style="color: #6b7280; font-size: 14px; margin: 0;">© 2024 Tranquillity Salon. All rights reserved.</p>
                                        <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0;">661 Levinia Street, Garsfontein, 0081</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
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
    cron.schedule('0 * * * *', () => {
        console.log('Running the appointment reminder task');
        sendAppointmentReminders();
    });
}

module.exports = {
    startAppointmentReminders,
    sendAppointmentReminders
};
