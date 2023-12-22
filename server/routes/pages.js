const express = require('express');
const route = express.Router();
const path = require("path");
const bodyParser = require('body-parser');
const mail = require('../config/mail');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { UserLoggin, AvoidIndex, ContestRoleBased } = require('../auth/userAuth');
const db = require('../config/dbConfig');
const cookieParser = require('cookie-parser');
const rand = Math.floor(Math.random() * 9999999)



// Middleware
route.use(
    session({
        secret: `Hidden_Key`,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true }
    })
);
route.use(cookieParser());
route.use(express.static(path.join(__dirname, 'statics')));
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));




route.get('/', AvoidIndex, (req, res) => {




    res.sendFile(path.join(__dirname, "../../statics", 'index.html'));
})

// Create A Database
route.get('/createDb', (req, res) => {
    let sql = 'CREATE DATABASE nica_app';

    db.query(sql, (err, result) => {
        if (err) {
            res.send('Database Creation Error');
        }
        res.send('A Database Created');
    })
})



// Create Tables 
route.get('/createTable', (req, res) => {


    const sqlUsers = `
    CREATE TABLE IF NOT EXISTS nica_app.users (
      user_id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'staff', 'contestant') NOT NULL
    );
  `;

    const sqlAccounts = `
    CREATE TABLE IF NOT EXISTS nica_app.accounts (
      account_id INT UNIQUE PRIMARY KEY,
      account_balance INT DEFAULT 0,
      votes INT DEFAULT 0,
      phone_number INT,
      about VARCHAR(255),
      email VARCHAR(255) NOT NULL UNIQUE,
      user_id INT UNIQUE,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
  `;

    db.query(sqlUsers, (errRoles) => {
        if (errRoles) {
            console.log('Error creating roles table:', errRoles);
            return res.status(500).send('Internal Server Error');
        } console.log('Users Created Sucessfully');


        db.query(sqlAccounts, (err) => {
            if (err) {
                console.log('Error creating users table:', err);
                return res.status(500).send('Internal Server Error');
            }
        });
        res.send('Tables Created Successfully');
    });
});





// To register a new account 
route.get('/register', (req, res) => {

    const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;

    if (!userCookie) {
        res.sendFile(path.join(__dirname, "../../statics", 'signUp.html'));

    } else {

        res.redirect('/login');
    }


})

// To Login into the dashboard

route.get('/login', (req, res) => {
    const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;

    if (!userCookie) {
        res.sendFile(path.join(__dirname, "../../statics", 'login.html'));

    } else {

        res.redirect('/dashboard');
    }

});




// Register new Users 
route.post('/register/new', (req, res) => {
    const { email, username, password, passwordCofirm } = req.body;


    db.query('SELECT email FROM nica_app.users WHERE email = ?', [email], async (error, result) => {
        if (error) { console.log("Customized Error ", error); }
        if (result.length > 0) {
            return res.status(401).json({
                message: 'Email Already Taken'
            })
        } else if (password == passwordCofirm) {
            const hashedPassword = await bcrypt.hash(password, 10);
            db.query('INSERT INTO nica_app.users SET ?', { username: username, email: email, password: hashedPassword, role: 'contestant' }, (error, result) => {
                if (error) {
                    console.log('A Registeration Error Occured ', error);
                } else {
                    // const messages = {
                    //     from: {
                    //         name: 'NICA NIGERIA',
                    //         address: 'felixtemidayoojo@gmail.com',
                    //     },
                    //     to: email,
                    //     subject: "Nica Beauty Pagaentry",
                    //     text: `Dear ${username}, Welcome to NICA NIGERIA, \n \n Your Nica Account opening is successful . \n Your Signing up journey just began. \n \n Your entry is not complete until you have successfully paid for the enrollment. \n Payment can be made online or by bank transfer. \n Details are as follows`,
                    // }
                    // mail.sendIt(messages)

                    // To create the account table into the user 
                    db.query('SELECT * FROM nica_app.accounts WHERE email = ?', [email], async (error, result) => {
                        if (error) {

                            return res.status(500).json({
                                message: 'Internal Server Error'
                            });
                        } else {

                            db.query('SELECT * FROM nica_app.users WHERE email = ?', [email], async (error, result) => {
                                if (error) {

                                    return res.status(500).json({
                                        message: 'Internal Server Error'
                                    });
                                } else {
                                    db.query('INSERT INTO nica_app.accounts SET ?', { user_id: result[0].user_id, email: email, account_id: rand, account_balance: 0 });
                                }
                            });
                        }
                    });


                    return res.sendFile(path.join(__dirname, "../../statics", 'payment.html'));
                }

            });


        } else {
            return res.redirect('/register');
        }

    })

});

// Fill in the Account Details Of the User
route.post('/account-details', (req, res) => {

    res.send('Account Created');
})


// Login route
route.post('/login/account', async (req, res) => {
    const { email, password } = req.body;


    // Check if the user and account details with the provided email exists

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
       FROM nica_app.users u
       LEFT JOIN nica_app.accounts a ON u.user_id = a.user_id
       WHERE u.email = ?;
     `;
    db.query(sqlGetUserWithAccount, [email], async (error, result) => {
        if (error) {

            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }

        if (result.length === 0) {
            return res.status(401).json({
                message: 'Invalid Email or Password'
            });
        }
        console.log('This is the Login Result :', result);
        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, result[0].password);
        if (!isPasswordValid) {
            // Password is invalid
            return res.status(401).json({
                message: 'Invalid Email or Password'
            });

        }


        req.app.set('userData', result[0])


        const userWithAccount = result[0];
        console.log('This is the User DashBoard Details :', userWithAccount);
        res.cookie('user', JSON.stringify(userWithAccount));
        req.session.userId = result[0].id
        res.redirect('/dashboard');
    });
});


// Dashboard route
route.get('/dashboard', UserLoggin, (req, res) => {
    const userData = req.app.get('userData');
    const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;
    console.log('Here is my Dashboard Data', userCookie);
    if (!userCookie) {
        res.redirect('/login');
    } else {
        const user = db.query('SELECT * FROM nica_app.users WHERE email = ?', [userData.email], async (error, result) => {

            console.log('This is the dashboard Details : ', userData);
            if (error) {
                console.log(" Login Error :", error);
                return res.redirect('/logout');
            }
            if (result) {
                res.render('home', { userData, });
            }

        })
    }
});









// Tp Update New Username 
route.post('/profile/updateUser', UserLoggin, async (req, res) => {
    try {
        const { username } = req.body;
        const userData = req.app.get('userData');

        // Ensure you have a 'db' object representing your database connection
        let updateUsername = 'UPDATE nica_app.users SET username = ? WHERE email = ?';
        let values = [username, userData.email];

        // Assuming 'db.query' is a valid method provided by your database library
        db.query(updateUsername, values, (error, result) => {
            if (error) {
                console.log('An Update Error Occurred ', error);
                res.status(500).send('An Update Error Occurred');
            } else {
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
                FROM nica_app.users u
                LEFT JOIN nica_app.accounts a ON u.user_id = a.user_id
                WHERE u.email = ?;
              `;
                db.query(sqlGetUserWithAccount, [userData.email], async (error, result) => {
                    if (error) {

                        return res.status(500).json({
                            message: 'Internal Server Error'
                        });
                    }

                    if (result.length === 0) {
                        return res.status(401).json({
                            message: 'Invalid Email or Password'
                        });
                    }
                    console.log('This is the Login Result :', result);
                    // Compare the provided password with the hashed password in the database

                    req.app.set('userData', result[0])


                    const userWithAccount = result[0];
                    res.clearCookie('user');
                    res.cookie('user', JSON.stringify(userWithAccount));
                    res.redirect('/dashboard');

                });

            }
        });
    } catch (err) {
        console.error('Error Loading Update:', err);
        res.status(500).send('Error Loading Update');
    }
});





// To Update The Password Data 
route.post('/profile/updatePass', UserLoggin, async (req, res) => {

    try {
        const { oldPassword, newPassword } = req.body;
        const userData = req.app.get('userData');

        // Retrieve the current hashed password from the database
        const selectQuery = 'SELECT password FROM users WHERE email = ?';
        let selectValues = [userData.email];

        db.query(selectQuery, selectValues, async (selectError, selectResults) => {
            if (selectError) {
                console.error('Database select error:', selectError);
                res.status(500).send('Error selecting password from the database');
                return;
            }

            if (selectResults.length === 0) {
                res.status(404).send('User not found');
                return;
            }

            const hashedPassword = selectResults[0].password;

            // Compare the provided old password with the hashed password
            const passwordMatch = await bcrypt.compare(oldPassword, hashedPassword);

            if (passwordMatch) {
                // Hash the new password
                const hashedNewPassword = await bcrypt.hash(newPassword, 10);

                // Update the password in the database
                const updateQuery = 'UPDATE users SET password = ? WHERE email = ?';
                const updateValues = [hashedNewPassword, userData.email];

                db.query(updateQuery, updateValues, updateError => {
                    if (updateError) {
                        console.error('Database update error:', updateError);
                        res.status(500).send('Error updating password in the database');
                        return;
                    }
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
                    FROM nica_app.users u
                    LEFT JOIN nica_app.accounts a ON u.user_id = a.user_id
                    WHERE u.email = ?;
                  `;
                    db.query(sqlGetUserWithAccount, [userData.email], async (error, result) => {
                        if (error) {

                            return res.status(500).json({
                                message: 'Internal Server Error'
                            });
                        }

                        if (result.length === 0) {
                            return res.status(401).json({
                                message: 'Invalid Email or Password'
                            });
                        }
                        console.log('This is the Login Result :', result);
                        // Compare the provided password with the hashed password in the database

                        req.app.set('userData', result[0])


                        const userWithAccount = result[0];
                        res.clearCookie('user');
                        res.cookie('user', JSON.stringify(userWithAccount));
                        res.redirect('/dashboard');

                    });
                });
            } else {
                res.status(401).send('Incorrect old password');
            }
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).send('Unexpected error');
    }
});

// To use Nica coin to get votes
route.post('/convert/vote', UserLoggin, (req, res) => {
    let { amount, totalVotes } = req.body;
    const userData = req.cookies.user ? JSON.parse(req.cookies.user) : null;

    if (!amount) {
        res.send('Enter a number');
    }
    const amont = parseInt(amount);
    const totalV = parseInt(totalVotes);
    const amt = amont * 50;
    const newBal = userData.account_balance - amt;

    const newVote = amont + userData.votes

    if (amont <= totalV) {
        let voting = 'UPDATE nica_app.accounts SET votes = ? WHERE email = ?';
        let debit = 'UPDATE nica_app.accounts SET account_balance = ? WHERE account_id = ?';
        let values = [newVote, userData.email];
        let val = [newBal, userData.account_id];

        // Assuming 'db.query' is a valid method provided by your database library
        db.query(voting, values, (error, result) => {
            if (error) {
                console.log('A Voting Error Occurred ', error);
                res.status(500).send('A Voting Error Occurred');
            } else {

            }
        })
        db.query(debit, val, (error, result) => {
            if (error) {
                console.log('A Voting Error Occurred ', error);
                res.status(500).send('A Voting Error Occurred');
            } else {
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
                FROM nica_app.users u
                LEFT JOIN nica_app.accounts a ON u.user_id = a.user_id
                WHERE u.email = ?;
              `;
                db.query(sqlGetUserWithAccount, [userData.email], async (error, result) => {
                    if (error) {

                        return res.status(500).json({
                            message: 'Internal Server Error'
                        });
                    }

                    if (result.length === 0) {
                        return res.status(401).json({
                            message: 'Invalid Email or Password'
                        });
                    }

                    req.app.set('userData', result[0])


                    const userWithAccount = result[0];
                    res.clearCookie('user');
                    res.cookie('user', JSON.stringify(userWithAccount));
                    return res.redirect('/nica/profile');
                });

            }
        })

    } else {
        res.send('Insufficient Balance');
    }
})



// Logout route
route.get('/logout', (req, res) => {


    req.session.destroy((err) => {
        delete userData
        res.clearCookie('user');
        if (err) {
            console.error(err);
            res.status(500).send('Error logging out');
        } else {

            res.redirect('/login');
        }
    });
});



module.exports = route;