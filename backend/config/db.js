const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,        // e.g. ehr.cpcumqwayeuq.ap-south-1.rds.amazonaws.com
  user: process.env.DB_USER,        // admin
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,    // ehr_db
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
