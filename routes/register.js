const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt')
const User = require('../models/user.js');

router.get('/', (req, res) => {
    res.render('register');
});

router.post('/', async (req, res) => {
    try {
        const {email, username, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            email: email,
            username: username,
            password: hashedPassword
        });

        if(await User.findOne({ email: email})){
            throw new UserException("El. paštas jau egzistuoja!");
        }else if(await User.findOne({username: username})){
            throw new UserException("Vartotojo vardas jau egzistuoja!");
        }

        await newUser.save().then(() => {
            res.redirect('/login')
        });
    } catch (error) {
        if(error.name == "UserException"){
            const message = encodeURIComponent(error.message);
            res.redirect('register/?error=' + message);
        }else{
            console.log(error)
        }
    }
})

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/');
}

function UserException(message) {
    this.message = message;
    this.name = "UserException"
}

module.exports = router;