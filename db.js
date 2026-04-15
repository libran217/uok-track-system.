const mysql = require('mysql2');

// Create the connection to the database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'uok_db'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to SQL Database as ID ' + connection.threadId);
});

module.exports = connection;

