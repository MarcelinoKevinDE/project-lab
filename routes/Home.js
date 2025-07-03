const express = require('express');
const router = express.Router();

// Middleware cek login
function isLoggedIn(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

router.get('/', isLoggedIn, (req, res) => {
    res.render('home', { user: req.session.user });
});

module.exports = router;
