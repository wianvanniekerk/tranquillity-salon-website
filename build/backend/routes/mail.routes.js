const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
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

router.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    const mailOptionsTranquillity = {
        from: '"Tranquillity Salon" <admin@tranquillitysalon.co.za>',
        to: 'admin@tranquillitysalon.co.za',
        subject: 'Contact Form Submission',
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
        html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`
    };

    const mailOptionsUser = {
        from: '"Tranquillity Salon" <admin@tranquillitysalon.co.za>',
        to: email,
        subject: 'Contact Form Submission',
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Contact Form - Tranquillity Salon</title>
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
                    .info-panel {
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
                        <img src="https://res.cloudinary.com/daiaxqvvr/image/upload/v1721458782/tranquility-logo_exggpt.png" alt="Tranquillity Salon">
                    </div>
                    <div class="content">
                        <h1>Contact Form Submission</h1>
                        <p>You have successfully filled our contact form with the following information:</p>
                        <div class="info-panel">
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Message:</strong> ${message}</p>
                        </div>
                        <p>Our team will be in contact with you as soon as possible.</p>
                        <div class="fine-print">
                            <p>If you didn't fill out this form, you can safely ignore this email. Someone might have accidentally entered your email address.</p>
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
        await transporter.sendMail(mailOptionsTranquillity);
        await transporter.sendMail(mailOptionsUser);
        res.send('Email sent successfully.');
    } catch (error) {
        console.error('Error sending email: ', error);
        res.status(500).send('Error sending email.');
    }
});


module.exports = router;
