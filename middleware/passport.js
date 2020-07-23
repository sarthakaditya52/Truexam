const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bycript = require('bcryptjs');

//User module
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email'}, (email, password, done) => {
            User.findOne({ email: email})
                .then(user => {
                    if(!user)
                        return done(null, false, { msg: 'That email is not registered' });

                    bycript.compare(password, user.password, (err, isMatch) => {
                        if(err) throw err;
                        if(isMatch)
                            return done(null, user);
                        else
                            return done(null, false, { msg: 'Password incorrect' });
                    });
                })
                .catch(err => console.log(err));
        })
    );
    
    passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
    
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
}