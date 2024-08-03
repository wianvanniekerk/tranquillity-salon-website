const express = require('express');
const router = express.Router();
const config = require('../config/db.config');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const executeQuery = (query, params) => {
    return new Promise((resolve, reject) => {
        config.query(query, params, (error, results) => {
            if (error) {
                console.error('Error executing query:', error);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};


router.post('/submit', async (req, res) => {
    const {
        phoneNumber, occupation, address, area, postalCode, dateOfBirth, marketingConsent, idNumber, password, token,
        current_skin_care_range, hormonal_imbalance, pregnant, breastfeeding, smoker, skin_cancer, ipl_laser_2weeks,
        skin_resurfacing_chemical_peels_2weeks, botox_fillers_2weeks, waxing_electrolysis_3days, medical_conditions_surgery_past_year,
        tretinoin_medication, accutane_medication, cortisone_medication, thyroid_medication, blood_pressure_medication,
        hormonal_contraceptives, other_medications, allergies
    } = req.body;

    try {
        const selectQuery = 'SELECT ClientID, AppointmentID FROM AppointmentTokens WHERE Token = ?';
        const selectParams = [token];
        const results = await executeQuery(selectQuery, selectParams);

        if (results.length === 0) {
            console.error('No appointment found for token:', token);
            req.flash('error', 'Invalid or expired token.');
            return res.redirect('/');
        }

        const clientId = results[0].ClientID;
        const appointmentId = results[0].AppointmentID;

        const hashedPassword = await bcrypt.hash(password, 10);
        const convertToTinyInt = (value) => value === 'on' || value === '1' || value === 'true' ? 1 : 0;

        const updateClientQuery = `
            UPDATE Client SET
                PhoneNumber = ?, Occupation = ?, Address = ?, Area = ?, PostalCode = ?, DateOfBirth = ?, RegistrationDate = NOW(),
                MarketingConsent = ?, IsActive = 1, CreatedAt = NOW(), IDNumber = ?, Password = ?
            WHERE ClientID = ?`;
        const updateClientParams = [phoneNumber, occupation, address, area, postalCode, new Date(dateOfBirth), marketingConsent, idNumber, hashedPassword, clientId];

        const insertQuery = `
            INSERT INTO AppointmentClientHistory
                (AppointmentID, CurrentRange, HormonalImbalance, Pregnant, Breastfeeding, Smoker, SkinCancer, IPL_Laser_2Weeks, SkinResurfacing_ChemicalPeels_2Weeks, BotoxFillers_2Weeks, WaxingElectrolysis_3Days, MedicalConditions_Surgery_PastYear, TretinoinMedication, AccutanesMedication, CortisoneMedication, ThyroidMedication, BloodPressureMedication, HormonalContraceptives, OtherMedication, Allergies, CreatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
        const insertParams = [
            appointmentId,
            current_skin_care_range,
            convertToTinyInt(hormonal_imbalance),
            convertToTinyInt(pregnant),
            convertToTinyInt(breastfeeding),
            convertToTinyInt(smoker),
            convertToTinyInt(skin_cancer),
            convertToTinyInt(ipl_laser_2weeks),
            convertToTinyInt(skin_resurfacing_chemical_peels_2weeks),
            convertToTinyInt(botox_fillers_2weeks),
            convertToTinyInt(waxing_electrolysis_3days),
            medical_conditions_surgery_past_year,
            convertToTinyInt(tretinoin_medication),
            convertToTinyInt(accutane_medication),
            convertToTinyInt(cortisone_medication),
            convertToTinyInt(thyroid_medication),
            convertToTinyInt(blood_pressure_medication),
            convertToTinyInt(hormonal_contraceptives),
            other_medications,
            allergies
        ];

        await executeQuery(updateClientQuery, updateClientParams);
        await executeQuery(insertQuery, insertParams);

        req.flash('success', 'Form submitted successfully.');
        res.redirect('/');
    } catch (error) {
        console.error('Unexpected error in submit route:', error);
        req.flash('error', 'An unexpected error occurred. Please try again.');
        res.redirect('/forms/client?token=' + token);
    }
});


router.get('/client', async (req, res) => {
    const token = req.query.token;

    if (!token) {
        return res.status(400).send('Invalid or missing token.');
    }

    try {
        const tokenQuery = 'SELECT ClientID, ExpireDate FROM AppointmentTokens WHERE Token = ?';
        const results = await executeQuery(tokenQuery, [token]);

        if (results.length === 0) {
            return res.status(400).send('Invalid or expired token.');
        }

        const clientId = results[0].ClientID;
        const expireDate = results[0].ExpireDate;

        if (new Date() > expireDate) {
            return res.status(400).send('Token has expired.');
        }

        res.render('forms/client-form', {
            clientId,
            token
        });
    } catch (error) {
        console.error('Error fetching token details:', error);
        return res.status(500).send('Internal server error.');
    }
});


module.exports = router;