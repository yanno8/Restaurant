const express = require('express')
const router = express.Router()
const User = require('../models/user')
const Booking = require('../models/booking')
const Employee = require('../models/employee')
const passport = require('passport')
const multer = require('multer')
const path = require('path')
const countries = require('../files/countries.json')

// Set image storage 

let storage = multer.diskStorage({
    destination: './public/pictures/',
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

let upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb)
    }
})

// Check file type
function checkFileType(file, cb) {
    const fileType = /jpeg|jpg|png|gif/
    const extname = fileType.test(path.extname(file.originalname).toLowerCase())
    if (extname) {
        return cb(null, true)
    } else {
        if (req.i18n_lang == 'fr') {
            cb('Erreur : S\'il vous plaît images seulement.');
        } else if (req.i18n_lang == 'en') {
            cb('Error: Please images only.');
        }
    }
}

// Checks if user is authenticated
function isAuthenticatedAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        if (res.locals.currentUser.active == false) {
            if (req.i18n_lang == 'fr') {
                req.flash('error_msg', "Vous devez d'abord vérifier votre e-mail. Réessayez!!!");
                res.redirect('/admin/login');
            } else if (req.i18n_lang == 'en') {
                req.flash('error_msg', "You need to verify your email first. Try again!!!");
                res.redirect('/admin/login');
            }
        }
        return next();
    }
    if (req.i18n_lang == 'fr') {
        req.flash('error_msg', "Veuillez d'abord vous connecter pour accéder à cette page.");
        res.redirect('/login');
    } else if (req.i18n_lang == 'en') {
        req.flash('error_msg', "Please login first to access this page.");
        res.redirect('/login');
    }
}

// Check User login
function checkAdmin(req, res, next) {
    User.findOne({ email: req.body.email })
        .then(admin => {
            if (admin.role != 'customer') {
                console.log(admin.role);
                return next();
            } else {
                if (req.i18n_lang == 'en') {
                    req.flash('error_msg', 'Only Super Admin or Admin can login here.')
                    res.redirect('/admin/login')
                } else if (req.i18n_lang == 'fr') {
                    req.flash('error_msg', 'Seul le Super Admin ou Admin peut se connecter ici.')
                    res.redirect('/admin/login')
                }
            }
        })
    if (!req.body.email) {
        console.log(req.body.currentUserEmail)
        User.findOne({ email: req.body.currentUserEmail })
            .then(user => {
                if (!user) {
                    if (req.i18n_lang == 'fr') {
                        req.flash('error', "Email invalide. Réessayez");
                        res.redirect('/admin/login');
                    } else if (req.i18n_lang == 'en') {
                        req.flash('error', "Invalid Email. Try again!!!");
                        res.redirect('/admin/login');
                    }
                }
                if (user.active == false) {
                    if (req.i18n_lang == 'fr') {
                        req.flash('error', "Vous devez d'abord vérifier votre e-mail. Réessayez!!!");
                        res.redirect('/admin/login');
                    } else if (req.i18n_lang == 'en') {
                        req.flash('error', "You need to verify your email first. Try again!!!");
                        res.redirect('/admin/login');
                    }
                }
            })
            .catch(err => {
                if (req.i18n_lang == 'fr') {
                    req.flash('error', "Email ou mot de passe invalide. Réessayez!!!");
                    console.log('ERROR:' + err);
                } else if (req.i18n_lang == 'en') {
                    req.flash('error', "Invalid email or password. Try again!!!");
                    console.log('ERROR:' + err);
                }
            });
    }
}

// Starting GET Router

router.get('/create/admin', isAuthenticatedAdmin, (req, res, next) => {
    return res.render('create-admin', {page: 'create-admin', countries: countries });
});

router.get('/admin/login', (req, res, next) => {
    return res.render('admin', { layout: 'admin' });
});

router.get('/signout', (req, res, next) => {
    req.logout();
    if (req.i18n_lang == 'en') {
        req.flash('success_msg', 'You have been logged out.');
        res.redirect('/admin/login');
    } else if (req.i18n_lang == 'fr') {
        req.flash('success_msg', 'Vous avez été déconnecté.');
        res.redirect('/admin/login');
    }
});

router.get('/admins', isAuthenticatedAdmin, (req, res, next) => {
    const role = 'admin'
    User.find({ role: role })
        .then(user => {
            return res.render('list-admin', { page: 'admins', user: user });
        })
        .catch(err => {
            if (req.i18n_lang == 'fr') {
                req.flash('error_msg', 'Un problème est apparu lors de l\'obtention des administrateurs')
                res.redirect('/admin/dashboard', {page: 'admins'});
            } else if (req.i18n_lang == 'en') {
                req.flash('error_msg', 'A problem arised while getting the administrators')
                res.redirect('/admin/dashboard', {page: 'admins'});
            }
        })
});

router.get('/admin/dashboard', isAuthenticatedAdmin, async(req, res, next) => {
    var date = [];
    var user_number = [];
    const users = await User.find({}).countDocuments();
    const bookings = await Booking.find({}).countDocuments();
    const employees = await Employee.find({}).countDocuments();
    const users_stat = await User.aggregate([
        {
            $project:
            {
                createdAt:
                {
                    $dateToString:
                        { format: "%Y-%m-%d", date: "$createdAt" }
                }
            }
        },
        {
            $group: {
                _id:
                    { createdAt: "$createdAt" },
                count: { $sum: 1 }
            }
        },
        {
            $project:
                { _id: 0, createdAt: "$_id.createdAt", count: 1 }
        },
        {
            $sort:
                { "createdAt": -1 }
        }
    ]);
    const bookings_stat = await Booking.aggregate([
        {
            $project:
            {
                createdAt:
                {
                    $dateToString:
                        { format: "%Y-%m-%d", date: "$createdAt" }
                }
            }
        },
        {
            $group: {
                _id:
                    { createdAt: "$createdAt" },
                count: { $sum: 1 }
            }
        },
        {
            $project:
                { _id: 0, createdAt: "$_id.createdAt", count: 1 }
        },
        {
            $sort:
                { "createdAt": -1 }
        }
    ]);
    console.log(bookings_stat);

        res.render('dashboard', { page: 'dashboard', userCount: users, bookingCount: bookings, employeeCount: employees, date: date, users_stat, bookings_stat, req, res });        
});

// Starting POST router

router.post('/admin/login', checkAdmin, passport.authenticate('local', {
    successRedirect: '/admin/dashboard',
    failureRedirect: '/admin/login',
    failureFlash: true
}));

router.post('/create/admin', async(req, res, next) => {
    let {
        email,
        password,
        lastName,
        firstName,
        birthdayPlace,
        confirmPassword,
        birthday,
        gender,
        country,
        address,
        phone
    } = req.body;

    const code = Math.floor(Math.random() * 933972) + 192021;

    var url;
    if (gender == "male") {
        url = "/images/male.jpg";
    } else if (gender == "female") {
        url = "/images/female.jpg ";
    }
    if (!firstName || !lastName || !email || !password || !phone || !country || !gender || !address || !birthday || !birthdayPlace || !confirmPassword) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', "Please fill in all fields.");
            return res.redirect('/create/admin');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Veuillez remplir tous les champs.");
            return res.redirect('/create/admin');
        }
    }

    const member = await User.findOne({ email: email })
    if (member) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', 'This email is already used.')
            res.redirect('/create/admin');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Cet email est deja utilisé.");
            return res.redirect('/create/admin');
        }
    }
    if (!/^\d+$/.test(phone)) {
        if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Veuillez enter uniquement des chiffres pour votre numéro de téléphone.");
            return res.redirect('/create/admin');
        } else if (req.i18n_lang == 'en') {
            req.flash('error_msg', "Please enter only numbers for your telephone number.");
            return res.redirect('/create/admin');
        }
    }
    var regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/
    if (!regex.test(password)) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', 'Password must contain at least one lowercase character, contain at least one uppercase character, contain at least 8 characters.');
            res.redirect('/create/admin');

        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Le mot de passe doit contenir au moins un caractère minuscule, contenir au moins un caractère majuscule, contenir au moins 8 caractères.");
            return res.redirect('/create/admin');
        }
    }
    if (password != confirmPassword) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', 'Password must be the same.');
            res.redirect('/create/admin');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Le mot de passe doit être le même.");
            return res.redirect('/create/admin');
        }
    }

    let admin = {
        avatar: url,
        email: email,
        lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        birthday: birthday,
        birthdayPlace: birthdayPlace.charAt(0).toUpperCase() + birthdayPlace.slice(1),
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        country: country,
        gender: gender,
        role: 'admin',
        type: 'leader',
        address: address,
        phone: phone,
        active: true,
        code: code
    };

    User.register(admin, password, (err, user) => {
        if (req.i18n_lang == 'fr') {
            req.flash('success_msg', "Administrateur créé avec succès");
            return res.redirect('/create/admin');
        } else if (req.i18n_lang == 'en') {
            req.flash('success_msg', 'Administrator created successfully.');
            res.redirect('/create/admin');
        }
    });
});

// Starting PUT Router

module.exports = router;