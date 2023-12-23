const express = require('express');
const routee = express.Router();
const path = require("path");
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { UserLoggin , AvoidIndex, AdminRoleBased } = require('../auth/userAuth');
const db = require('../config/dbConfig');
const cookieParser = require('cookie-parser');

const rand = Math.floor(Math.random() * 99999900090)

 

// Middleware
routee.use(
    session({
        secret: `Hidden_Key`,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true }
    })
);
routee.use(cookieParser());
routee.use(express.static(path.join(__dirname, 'statics')));
routee.use(bodyParser.json());
routee.use(bodyParser.urlencoded({ extended: true }));

// routee.use(AdminRoleBased);
 

routee.get('/contest', AdminRoleBased, (req , res)=>{
    const role = "contestant";
    const userData = req.cookies.user ? JSON.parse(req.cookies.user) : null;
    
    const sqlGetUserWithAccount = `
       SELECT 
         u.user_id,
         u.username,
         u.password,
         u.email,
         u.role,
         a.account_id,
         a.account_balance,
         a.votes,
         a.phone_number,
         a.about,
         a.email as account_email
       FROM bkew76jt01b1ylysxnzp.users u
       LEFT JOIN bkew76jt01b1ylysxnzp.accounts a ON u.user_id = a.user_id
       WHERE u.role = ?;
     `;
    db.query(sqlGetUserWithAccount, [role], async (error, result) => {
        if (error) {

            return res.status(500).json({
                message: 'Internal Server Error'
            });
        } const cont = result
        res.render('tableContestant', { userData, cont });
    })
})


module.exports = routee
