const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

//User Model
const User = require('./../../models/User');

// @route GET users/login
// @desc Render Login Page
// @access Public
router.get('/login', (req, res) => {
    res.render('login');
});

// @route GET users/register
// @desc Render Register Page
// @access Public
router.get('/register', (req, res) => {
    res.render('register');
});

// @route POST users/register
// @desc Register a new User
// @access Public
router.post('/register', (req, res) => {
    const { name, email, password, password2, userType } = req.body;
    let errors = [];
    let success_msg = [];

    if(!userType)
        errors.push({ msg: 'Please select User type' });
    if(password !== password2)
        errors.push({ msg: 'Passwords do not match' });
    
    if(errors.length > 0)
    {
        res.render('register',{
            errors,
            name,
            email,
            password,
            password2
        });
    }
    else
    {
        User.findOne({ email: email })
            .then( user => {
                if(user)
                {
                    //User already exists
                    errors.push({ msg: 'User already exists '});
                    res.render('register',{
                        errors,
                        name,
                        email,
                        password,
                        password2
                    });                  
                } else {
                    const newUser = new User({
                        name: name,
                        email: email,
                        password: password,
                        userType: userType
                    });

                    // Encrypt password
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if(err) throw err;

                            newUser.password = hash;

                            newUser.save()
                                .then(user => {
                                    success_msg.push({ msg: 'Registration succesfull, you can log in now'});
                                    res.render('login',{
                                        success_msg
                                    });
                                })
                                .catch(err => console.log(err));
                        });
                    });
                }
            })
    }
});

// @route POST users/login
// @desc Login
// @access Public
router.post('/login', (req, res, next) => {
    let errors = [];
    passport.authenticate('local', (err, user, info) => {
        if(err)
            console.log(err);
        if(user){
            console.log(user)
        }
        if(info){
            errors.push({ msg: info.msg});
            console.log(errors);
            res.render('login',{ errors });
        }
    })(req, res, next);
});

module.exports = router;

