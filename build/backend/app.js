require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const flash = require('connect-flash');
const dbConfig = require('./config/db.config');

// Import route handlers
const authRoutes = require('./routes/auth.routes');
const indexRoutes = require('./routes/index.routes');
const userProfilesRoutes = require('./routes/userProfiles.routes');
const productsRoutes = require('./routes/products.routes');
const inquiriesRoutes = require('./routes/inquiries.routes');
const mailRoutes = require('./routes/mail.routes');
const formsRoutes = require('./routes/forms.routes');

// Set up views and static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../build/frontend/views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../../build')));

// Set up session store
const sessionStore = new MySQLStore({
    expiration: 86400000,
    createDatabaseTable: true,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
}, dbConfig.config);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
}));

app.use(flash());

// Set up middleware for flash messages
app.use((req, res, next) => {
    res.locals.success_messages = req.flash('success');
    res.locals.error_messages = req.flash('error');
    next();
});

// Set up JSON parsing
app.use(express.json());

// Use route handlers
app.use('/', indexRoutes);
app.use(authRoutes);
app.use('/user', userProfilesRoutes);
app.use('/', productsRoutes);
app.use('/inquiries', inquiriesRoutes);
app.use('/inquiries', mailRoutes);
app.use('/forms', formsRoutes);

module.exports = app;
