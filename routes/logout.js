const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../config/ensureAuthenticated')

router.get('/', ensureAuthenticated, (req, res) => {
    req.logout()
    res.redirect('/')
});

module.exports = router;