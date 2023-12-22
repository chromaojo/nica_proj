require('dotenv').config();
const mysql = require('mysql');

// const db = mysql.createConnection({
//     host: process.env.HOST,
//     user: process.env.USER,
//     password: process.env.PASS,
//     database: process.env.DATABASE,
//     waitForConnections: true,
//   });

const db = mysql.createConnection({
  host: 'localhost',
  host: 'localhost',
  user: 'root',
  password: 'Oluchroma234',
  database: 'nica_app',
  waitForConnections: true,

});


// Workbench Setting 
// host: 'localhost',
// user: 'root',
// password: 'Oluchroma234',
// database: 'nica_app',
// waitForConnections: true,


// const db = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'nica_app',
// waitForConnections: true,
// });


db.connect((error) => {
  if (error) {
    console.log("Database Error :", error);
  } else {
    console.log("Database Connected Successfully");
  }
});

module.exports = db;