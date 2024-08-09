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
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                        color: #333;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        text-align: center;
                        padding-bottom: 20px;
                        border-bottom: 1px solid #dddddd;
                    }
                    .header img {
                        width: 100px;
                        margin-bottom: 10px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #333333;
                    }
                    .content {
                        padding: 20px 0;
                        text-align: left;
                    }
                    .content p {
                        line-height: 1.6;
                    }
                    .content .appointment-details {
                        background-color: #f9f9f9;
                        padding: 10px;
                        border-radius: 5px;
                        margin-top: 20px;
                        border: 1px solid #dddddd;
                    }
                    .footer {
                        text-align: center;
                        padding-top: 20px;
                        border-top: 1px solid #dddddd;
                        margin-top: 20px;
                        font-size: 12px;
                        color: #888888;
                    }
                    .footer a {
                        color: #888888;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://tranquillitysalon.co.za/logo.png" alt="Tranquillity Salon Logo">
                        <h1>Appointment Reminder</h1>
                    </div>
                    <div class="content">
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
                    </div>
                    <div class="footer">
                        <p>Tranquillity Salon | 661 Levinia Street, Garsfontein, 0081</p>
                        <p>Phone: <a href="tel:0832600148">083 260 0148</a> | Email: <a href="mailto:jolette@tranquillitysalon.co.za">admin@tranquillitysalon.co.za</a></p>
                        <p><a href="https://tranquillitysalon.co.za">Visit our website</a></p>
                        <p>If you no longer wish to receive these emails, you may <a href="https://tranquillitysalon.co.za/unsubscribe">unsubscribe</a> at any time.</p>
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
