const express = require('express');
const router = express.Router();

//Home Page
router.get('/', (req, res) => {
    res.redirect('/users/login');
});

module.exports = router;