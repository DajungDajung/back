// Get the client
const mariadb = require('mysql2')

// Create the connection to database
const connection =  mariadb.createConnection({
    host: 'localhost',
    user: 'root',
    password : 'root',
    database: 'Bookstore',
    dateStrings : true
  });

module.exports = connection