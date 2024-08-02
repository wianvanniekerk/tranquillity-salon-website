const app = require('./app');
const port = process.env.PORT || 3000;
const { startAppointmentReminders } = require('./jobs/appointmentReminders');

startAppointmentReminders();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});