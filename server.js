const app = require('./build/backend/app');
const port = process.env.PORT;
const { startAppointmentReminders } = require('./build/backend/jobs/appointmentReminders');
const { handleDisconnect } = require('./build/backend/config/db.config.js');

startAppointmentReminders();
handleDisconnect();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});