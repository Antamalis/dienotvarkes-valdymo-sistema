const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../config/ensureAuthenticated')

router.get('/', ensureAuthenticated, (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

module.exports = router;