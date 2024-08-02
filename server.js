const app = require('./build/backend/app');
const port = process.env.PORT;
const { startAppointmentReminders } = require('./build/backend/jobs/appointmentReminders');

startAppointmentReminders();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});