const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt')
const User = require('../models/user.js');
const passport = require('passport');
const ensureNotAuthenticated = require('../config/ensureNotAuthenticated')

router.get('/', ensureNotAuthenticated, (req, res) => {
    res.render('login', {user: req.user});
});

router.post('/', ensureNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));



module.exports = router;