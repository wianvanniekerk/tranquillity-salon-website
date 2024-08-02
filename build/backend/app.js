require('dotenv').config();
const express = require('express');
const app = express();
const authRoutes = require('./routes/auth.routes');
const indexRoutes = require('./routes/index.routes');
const userProfilesRoutes = require('./routes/userProfiles.routes');
const productsRoutes = require('./routes/products.routes');
const inquiriesRoutes = require('./routes/inquiries.routes');
const mailRoutes = require('./routes/mail.routes');
const formsRoutes = require('./routes/forms.routes');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_messages = req.flash('success');
    res.locals.error_messages = req.flash('error');
    next();
});

app.use(express.json());
app.use('/', indexRoutes);
app.use(authRoutes);
app.use('/user', userProfilesRoutes);
app.use('/', productsRoutes);
app.use('/inquiries', inquiriesRoutes);
app.use('/inquiries', mailRoutes);
app.use('/forms', formsRoutes);

module.exports = app;