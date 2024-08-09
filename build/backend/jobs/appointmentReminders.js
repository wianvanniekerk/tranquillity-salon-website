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
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                        background-color: #f0f4f8;
                    }
                    .container {
                        background-color: #ffffff;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        margin: 0 auto;
                        max-width: 600px;
                        padding: 15px;
                    }
                    .header {
                        background-color: #0d9488;
                        padding: 15px 20px;
                        text-align: center;
                    }
                    .header img {
                        max-width: 180px;
                        height: auto;
                    }
                    .content {
                        padding: 20px;
                    }
                    .content h1 {
                        color: #1f2937;
                        font-size: 22px;
                        margin-bottom: 15px;
                    }
                    .content p {
                        color: #4b5563;
                        font-size: 14px;
                        line-height: 1.5;
                        margin-top: 10px;
                    }
                    .appointment-details {
                        background-color: #f9fafb;
                        border: 1px solid #e5e7eb;
                        border-radius: 4px;
                        padding: 15px;
                        margin-top: 10px;
                    }
                    .fine-print {
                        font-size: 12px;
                        color: #6b7280;
                        margin-top: 30px;
                    }
                    .footer {
                        background-color: #f3f4f6;
                        padding: 15px 20px;
                        text-align: center;
                    }
                    .footer p {
                        color: #6b7280;
                        font-size: 12px;
                        margin: 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://tranquillitysalon.co.za/logo.png" alt="Tranquillity Salon">
                    </div>
                    <div class="content">
                        <h1>Appointment Reminder</h1>
                        <p>Dear ${appointment.FirstName},</p>
                        <p>This is a friendly reminder that you have an appointment scheduled at <strong>Tranquillity Salon</strong>:</p>
                        <div class="appointment-details">
                            <p><strong>Date:</strong> ${new Date(appointment.AppointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p><strong>Time:</strong> ${new Date(appointment.AppointmentDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                        </div>
                        <p>If you need to reschedule or have any questions, please do not hesitate to contact us at <a href="tel:0832600148">083 260 0148</a>.</p>
                        <p>We look forward to welcoming you to our salon.</p>
                        <p>Best regards,</p>
                        <p><strong>The Tranquillity Salon Team</strong></p>
                        <div class="fine-print">
                            <p>If you didn't schedule this appointment, please ignore this email or contact us immediately.</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>© 2024 Tranquillity Salon. All rights reserved.</p>
                        <p>661 Levinia Street, Garsfontein, 0081</p>
                    </div>
                </div>
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
