const express = require('express');
const router = express.Router();
const { config } = require('../config/db.config');
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

router.get('/skin-analysis', (req, res) => {
    try {
        res.render('inquiries/skin-analysis');
    } catch (err) {
        console.error('Error rendering skin analysis page:', err);
        req.flash('error', 'Unable to load skin analysis page. Please try again.');
        res.redirect('/');
    }
});

router.get('/about', (req, res) => {
    try {
        res.render('inquiries/about');
    } catch (err) {
        console.error('Error rendering about page:', err);
        req.flash('error', 'Unable to load about page. Please try again.');
        res.redirect('/');
    }
});

router.get('/product-consultation', (req, res) => {
    try {
        res.render('inquiries/product-consultation');
    } catch (err) {
        console.error('Error rendering product consultation page:', err);
        req.flash('error', 'Unable to load product consultation page. Please try again.');
        res.redirect('/');
    }
});

router.get('/contact', (req, res) => {
    function formatPhoneNumber(phoneNumber) {
        return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }

    const query = 'SELECT * FROM Staff WHERE StaffID = 1 OR StaffID = 2';

    executeQuery(query, [], (error, staffMembers) => {
        if (error) {
            req.flash('error', 'Unable to fetch staff information. Please try again.');
            return res.redirect('/');
        }

        res.render('inquiries/contact', {
            staffMembers,
            formatPhoneNumber,
            successMessage: req.flash('success'),
            errorMessage: req.flash('error')
        });
    });
});

module.exports = router;
