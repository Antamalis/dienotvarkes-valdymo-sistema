const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt')
const User = require('../models/user.js');
const ensureNotAuthenticated = require('../config/ensureNotAuthenticated')

router.get('/', ensureNotAuthenticated, (req, res) => {
    res.render('register', {user: req.user});
});

router.post('/', ensureNotAuthenticated, async (req, res) => {
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

        await newUser.save()

        res.redirect('/login')
    } catch (error) {
        if(error.name == "UserException"){
            req.flash('error', error.message);
            res.redirect('register');
        }else{
            console.log(error);
        }
    }
})

function UserException(message) {
    this.message = message;
    this.name = "UserException"
}

module.exports = router;