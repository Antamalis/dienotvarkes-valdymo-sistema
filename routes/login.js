const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt')
const User = require('../models/user.js');
const passport = require('passport');


router.get('/', ensureNotAuthenticated, (req, res) => {
    res.render('login', {user: req.user});
});

router.post('/', ensureNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

function ensureNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { 
        res.redirect('/');
    }else{
        return next();
    }
}

module.exports = router;