module.exports = {
  ensureAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        let errors = [];
        errors.push({ msg: ' Please login '});
        res.render('login',{ errors }); 
    },
    ensureStudent: function(req, res, next) {
        let errors = [];
        if (req.isAuthenticated()) {
            if(req.user.userType === 'S')
                return next();
            errors.push({ msg: ' Unauthorized '});
            return res.render('login',{ errors }); 
        }
        errors.push({ msg: ' Unauthorized '});
        res.render('login',{ errors });         
    },
    ensureInstructor: function(req, res, next) {
        let errors = [];
        if (req.isAuthenticated()) {
            if(req.user.userType === 'I')
                return next();
            errors.push({ msg: ' Unauthorized '});
            return res.render('login',{ errors }); 
        }
        errors.push({ msg: ' Unauthorized '});
        return res.render('login',{ errors });         
    }
}