// Get the client
const mariadb = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

// Create the connection to database
const connection = mariadb.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,
});

module.exports = connection;
