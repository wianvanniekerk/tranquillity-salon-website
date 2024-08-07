const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
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

const executeQuery = (query, params, callback) => {
    config.query(query, params, (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            return callback(error, null);
        }
        callback(null, results);
    });
};

router.get('/profile', (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.redirect('/login');
    }

    const userQuery = 'SELECT * FROM `Client` WHERE `ClientID` = ?';
    const appointmentsQuery = 'SELECT * FROM `Appointment` WHERE `ClientID` = ? ORDER BY `AppointmentDate` DESC';
    const clientSkinProfilesQuery = `
        SELECT
            csp.ClientSkinProfileID,
            csp.ClientID,
            csp.Concerns,
            csp.Allergies,
            csp.LastAnalysisDate,
            csp.NextFollowUpDate,
            csp.Notes,
            csp.CreatedAt,
            sc.SkinClassificationName
        FROM
            ClientSkinProfile csp
        JOIN
            SkinClassification sc
        ON
            csp.SkinClassificationID = sc.SkinClassificationID
        WHERE
            csp.ClientID = ?
        ORDER BY
            csp.LastAnalysisDate DESC
    `;
    const ordersQuery = 'SELECT * FROM `Order` WHERE `ClientID` = ? ORDER BY `OrderDate` DESC';
    const productUsageQuery = `
        SELECT u.*, p.ProductName
        FROM ProductUsage u
        JOIN Product p ON u.ProductID = p.ProductID
        WHERE u.ClientID = ? ORDER BY u.PurchaseDate DESC
    `;

    executeQuery(userQuery, [userId], (error, userResults) => {
        if (error) {
            req.flash('error', 'Unable to load profile information. Please try again.');
            return res.redirect('/');
        }

        executeQuery(appointmentsQuery, [userId], (error, appointmentResults) => {
            if (error) {
                req.flash('error', 'Unable to load appointment information. Please try again.');
                return res.redirect('/');
            }

            executeQuery(clientSkinProfilesQuery, [userId], (error, skinProfileResults) => {
                if (error) {
                    req.flash('error', 'Unable to load skin profile information. Please try again.');
                    return res.redirect('/');
                }                

                executeQuery(ordersQuery, [userId], (error, orderResults) => {
                    if (error) {
                        req.flash('error', 'Unable to load order information. Please try again.');
                        return res.redirect('/');
                    }

                    executeQuery(productUsageQuery, [userId], (error, productUsageResults) => {
                        if (error) {
                            req.flash('error', 'Unable to load product usage information. Please try again.');
                            return res.redirect('/');
                        }

                        res.render('profiles/profile', {
                            user: userResults[0],
                            appointments: appointmentResults,
                            clientSkinProfiles: skinProfileResults,
                            orders: orderResults,
                            productUsage: productUsageResults,
                            successMessage: req.flash('success'),
                            errorMessage: req.flash('error')
                        });
                    });
                });
            });
        });
    });
});

router.put('/update-password', async (req, res) => {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
        return res.status(400).json({ error: 'User ID and new password are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const query = `
            UPDATE Client
            SET Password = ?
            WHERE ClientID = ?
        `;

        const params = [hashedPassword, userId];

        executeQuery(query, params, (err, result) => {
            if (err || result.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found.' });
            }

            res.status(200).json({ message: 'Password updated successfully.' });
        });
    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

router.get('/forgot-password', (req, res) => {
    res.render('profiles/forgot-password', { errorMessage: null });
});

router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    executeQuery('SELECT `ClientID` FROM `Client` WHERE `Email` = ?', [email], (error, result) => {
        if (error) {
            console.error('Error executing query:', error);
            return res.render('profiles/forgot-password', {
                errorMessage: 'An error occurred while processing your request. Please try again.'
            });
        }

        if (result.length === 0) {
            return res.render('profiles/forgot-password', {
                errorMessage: 'No account found with that email address. Please check and try again.'
            });
        }

        const userId = result[0].ClientID;
        const token = crypto.randomBytes(20).toString('hex');
        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + 1);

        executeQuery('INSERT INTO `PasswordResetTokens` (`ClientID`, `Token`, `ExpireDate`) VALUES (?, ?, ?)', [userId, token, expireDate], (error) => {
            if (error) {
                console.error('Error inserting token:', error);
                return res.render('profiles/forgot-password', {
                    errorMessage: 'An error occurred while processing your request. Please try again.'
                });
            }

            const resetLink = `https://tranquillity-salon-website-production.up.railway.app/user/reset-password?token=${token}`;
            const mailOptions = {
            from: '"Tranquillity Salon" <admin@tranquillitysalon.co.za>',
            to: email,
            subject: 'Password Reset - Tranquillity Salon',
            text: `You requested a password reset. Click the link to set a new password: ${resetLink}`,
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset - Tranquillity Salon</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f0f4f8;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0f4f8;">
                        <tr>
                            <td style="padding: 20px 0;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background-color: #0d9488; padding: 30px 40px; text-align: center;">
                                            <img src="https://res.cloudinary.com/daiaxqvvr/image/upload/v1721458782/tranquility-logo_exggpt.png" alt="Tranquillity Salon" style="max-width: 200px; height: auto;">
                                        </td>
                                    </tr>
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px;">
                                            <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Password Reset Request</h1>
                                            <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">You recently requested to reset your password for your Tranquillity Salon account. Click the button below to set a new password:</p>
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                                <tr>
                                                    <td style="border-radius: 4px; background-color: #0d9488;">
                                                        <a href="${resetLink}" target="_blank" style="border: none; border-radius: 4px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: bold; padding: 12px 24px; text-decoration: none;">Reset Password</a>
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin-top: 20px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
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
                </html>`};

                transporter.sendMail(mailOptions, (error) => {
                if (error) {
                    console.error('Error sending email:', error);
                    return res.render('profiles/forgot-password', {
                        errorMessage: 'An error occurred while sending the email. Please try again.'
                    });
                }

                res.render('profiles/forgot-password', {
                    successMessage: 'Password reset link sent to your email. Please check your inbox.'
                });
            });
        });
    });
});

router.get('/reset-password', (req, res) => {
    const { token } = req.query;
    res.render('profiles/reset-password', { token, errorMessage: null });
});

router.post('/reset-password', (req, res) => {
    const { token, newPassword } = req.body;

    executeQuery('SELECT `ClientID`, `ExpireDate` FROM `PasswordResetTokens` WHERE `Token` = ?', [token], (error, result) => {
        if (error) {
            console.error('Error executing query:', error);
            return res.render('profiles/reset-password', { token, errorMessage: 'Error resetting password. Please try again.' });
        }

        if (result.length === 0) {
            return res.render('profiles/reset-password', { token, errorMessage: 'Invalid or expired token.' });
        }

        const tokenData = result[0];
        if (new Date(tokenData.ExpireDate) < new Date()) {
            return res.render('profiles/reset-password', { token, errorMessage: 'Token has expired.' });
        }

        bcrypt.hash(newPassword, 10, (hashError, hashedPassword) => {
            if (hashError) {
                console.error('Error hashing password:', hashError);
                return res.render('profiles/reset-password', { token, errorMessage: 'Error resetting password. Please try again.' });
            }

            executeQuery('UPDATE `Client` SET `Password` = ? WHERE `ClientID` = ?', [hashedPassword, tokenData.ClientID], (updateError) => {
                if (updateError) {
                    console.error('Error updating password:', updateError);
                    return res.render('profiles/reset-password', { token, errorMessage: 'Error resetting password. Please try again.' });
                }

                executeQuery('DELETE FROM `PasswordResetTokens` WHERE `Token` = ?', [token], (deleteError) => {
                    if (deleteError) {
                        console.error('Error deleting token:', deleteError);
                    }

                    res.render('profiles/reset-password', { token: null, successMessage: 'Password reset successfully.' });
                });
            });
        });
    });
});

module.exports = router;