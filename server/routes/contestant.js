const express = require('express');
const rout = express.Router();
const { UserLoggin } = require('../auth/userAuth');
const path = require("path");
const rad = Math.floor()

rout.use(express.static(path.join(__dirname, 'statics')));


rout.get('/instagram', UserLoggin, (req , res)=>{
    const userData = req.app.get('userData');
    
    res.render('instagram', {userData,});
})

// Profile Page 
rout.get('/profile', UserLoggin, (req, res)=>{

    const userData = req.app.get('userData');
    res.render('profile', {userData,})
})

// Facebook Route is given as 
rout.get('/facebook', UserLoggin, (req, res) => {

    const userData = req.app.get('userData');
    res.render('facebook', { userData, });
})
// User edit Page 
rout.get('/edit', UserLoggin, (req, res) => {
    const userData = req.app.get('userData');

    res.render('userEdit', { userData});
})

// Payment page 
rout.get('/payment', (req, res) => {

    return res.sendFile(path.join(__dirname, "../../statics", 'payment.html'));
})

// To Get The Voting Page 
 
rout.get('/vote', UserLoggin, (req, res) => {
    const userData = req.app.get('userData');
    res.render('vote', { userData});
})

// To get the coin page 
rout.get('/coin', UserLoggin, (req, res) => {

    const userData = req.app.get('userData');
    return res.sendFile(path.join(__dirname, "../../statics", 'coin.html'));
})





module.exports = rout