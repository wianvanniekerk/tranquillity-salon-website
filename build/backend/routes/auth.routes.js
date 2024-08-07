const express = require('express');
const bcrypt = require('bcryptjs');
const { config } = require('../config/db.config');
const router = express.Router();
require('dotenv').config();

const executeQuery = (query, params, callback) => {
    config.query(query, params, (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            return callback(error, null);
        }
        callback(null, results);
    });
};

router.get('/login', (req, res) => {
    res.render('registration/login', { errorMessage: null });
});

router.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const query = `SELECT * FROM Client WHERE Email = ?`;
        executeQuery(query, [email], async (err, results) => {
            if (err || results.length === 0) {
                console.log('Error or no results:', err, results);
                return res.render('registration/login', { errorMessage: 'Invalid email or password.' });
            }

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.Password);

            if (!isMatch) {
                console.log('Password mismatch');
                return res.render('registration/login', { errorMessage: 'Invalid email or password.' });
            }

            req.session.userId = user.ClientID.toString();
            req.session.userType = user.UserType;

            console.log('User logged in:', req.session);

            req.flash('success', 'You have logged in successfully!');
            const redirectTo = req.session.returnTo || '/user/profile';
            delete req.session.returnTo;

            res.redirect(redirectTo);
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.render('registration/login', { errorMessage: 'Login failed. Please try again.' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/login');
    });
});


module.exports = router;
