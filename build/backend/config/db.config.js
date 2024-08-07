const dotenv = require('dotenv');
dotenv.config();

const mysql = require('mysql');

const config = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  multipleStatements: true 
});

config.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to database.');
});

function handleDisconnect() {
  connection = mysql.createConnection(dbConfig);

  connection.connect(err => {
      if (err) {
          console.error('Error connecting to the database:', err);
          setTimeout(handleDisconnect, 2000);
      } else {
          console.log('Connected to the database.');
      }
  });

  connection.on('error', err => {
      console.error('Database error:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          handleDisconnect();
      } else {
          throw err;
      }
  });
}

module.exports = config;