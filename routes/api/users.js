const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const fs = require('fs');
const { ensureAuthenticated, ensureStudent, ensureInstructor } =  require('./../../middleware/auth');

// Models
const User = require('./../../models/User');
const Task = require('./../../models/Task');

const multer = require('multer');
const randomstring = require('randomstring');
const path = require('path');

const storageOrig = multer.diskStorage({
    destination: './static/uploads/orignals',
    filename: function(req, file, callback) {
        callback(null, randomstring.generate() + path.extname(file.originalname))
    }		     
});

const storageEdit = multer.diskStorage({
    destination: './static/uploads/edits',
    filename: function(req, file, callback) {
        callback(null, randomstring.generate() + path.extname(file.originalname))
    }		     
});

const fileFilter = (req, file, callback) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg')
        callback(null, true);
    else
        callback(null,false);
}
const uploadOrig = multer({storage: storageOrig, fileFilter: fileFilter});
const uploadEdit = multer({storage: storageEdit, fileFilter: fileFilter});

// @route GET users/login
// @desc Render Login Page
// @access Public
router.get('/login', (req, res) => {
    if(req.user)
    {
        if(req.user.userType === 'S')
            return res.redirect('/users/student/dashboard');
        else if (req.user.userType === 'I')
            return res.redirect('/users/instructor/dashboard');
    }
    res.render('login');
});

// @route GET users/register
// @desc Render Register Page
// @access Public
router.get('/register', (req, res) => {
    if(req.user)
    {
        if(req.user.userType === 'S')
            return res.redirect('/users/student/dashboard');
        else if (req.user.userType === 'I')
            return res.redirect('/users/instructor/dashboard');
    }
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
            req.login(user, function(err) {
                if (err) { return next(err); }
                if(user.userType === 'S')
                    res.redirect('/users/student/dashboard')
                else if (user.userType === 'I')
                    res.redirect('/users/instructor/dashboard')
            });
        }
        if(info){
            errors.push({ msg: info.msg});
            return res.render('login',{ errors });
        }
    })(req, res, next);
});

// @route GET users/logout
// @desc Logout
// @access Private
router.get('/logout', ensureAuthenticated, (req, res) => {
    req.logout();
    let success_msg = [];
    success_msg.push({ msg: 'Logged out successfully'});
    res.render('login',{
        success_msg
    });
});

// @route GET users/student/dashboard
// @desc Student's dashboard
// @access Private
router.get('/student/dashboard', ensureStudent, async (req, res) => {
    const tasks = await Task.find({ studentEmail: req.user.email });
    return res.render('student',{ tasks });
});

// @route POST users/student/submitTask/:tid
// @desc Submit editted image
// @access Private
router.post('/student/submitTask/:tid', ensureStudent, uploadEdit.single('image'), (req, res) => {
    taskId = req.params.tid;
    Task.findOne({ _id: taskId })
        .then( task => {
            if(!task) {
                fs.unlink(req.file.path, (err) => {
                    if (err) throw err;
                });
                return res.redirect('/users/student/dashboard');
            }
            if(task.studentEmail !== req.user.email) {
                fs.unlink(req.file.path, (err) => {
                    if (err) throw err;
                });
                return res.redirect('/users/student/dashboard');
            }
            task.editImage = req.file.path.substr(21);
            task.save();
            return res.redirect('/users/student/dashboard');
        });
});


// @route GET users/instructor/dashboard
// @desc Instructor's dashboard
// @access Private
router.get('/instructor/dashboard', ensureInstructor, async (req, res) => {
    const tasks = await Task.find({ insID: req.user._id });
    return res.render('instructor',{ tasks });
});

// @route POST users/instructor/evaluate
// @desc Instructor evaluate submission
// @access Private
router.post('/instructor/evaluate/:tid', ensureInstructor, (req, res) => {
    const { score } = req.body;
    taskId = req.params.tid;
    Task.findOne({ _id: taskId })
        .then( task => {
            if(!task) {
                return res.redirect('/users/instructor/dashboard');
            }
            if(task.insID !== String(req.user._id)) {
                return res.redirect('/users/instructor/dashboard');
            }
            task.score = score;
            task.save();
            return res.redirect('/users/instructor/dashboard');
        });
});

// @route GET users/instructor/createTask
// @desc Create Image Editting Task
// @access Private
router.get('/instructor/createTask', ensureInstructor, (req, res) => {
    res.render('createTask');
});

// @route POST users/instructor/createTask
// @desc Create Image Editting Task
// @access Private
router.post('/instructor/createTask', ensureInstructor, uploadOrig.single('image'), (req, res) => {
    const { email } = req.body;
    let errors = [];
    let success_msg = [];
    User.findOne({ email: email})
        .then(user =>{
            if(user)
            {
                if(user.userType === 'S')
                {
                    const newTask = new Task({
                        insID: req.user._id,
                        studentEmail: user.email,
                        origImage: req.file.path.substr(24),
                        editImage: null,
                        score: -1
                    });
                    newTask.save()
                    .then(task => {
                        success_msg.push({ msg: 'Task Created Successfully'});
                        return res.render('createTask',{
                            success_msg
                        });
                    })
                    .catch(err => console.log(err));
                } else {
                    fs.unlink(req.file.path, (err) => {
                        if (err) throw err;
                    });
                    errors.push({msg: 'No student found with this id'});
                    return res.render('createTask',{
                        errors
                    });
                }
            } else {
                fs.unlink(req.file.path, (err) => {
                    if (err) throw err;
                });
                errors.push({msg: 'No student found with this id'});
                return res.render('createTask',{
                    errors
                });
            }
        });
});

module.exports = router;

