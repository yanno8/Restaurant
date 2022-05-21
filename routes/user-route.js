const express = require('express')
const router = express.Router()
const User = require('../models/user')
const passport = require('passport')
const multer = require('multer')
const path = require('path')
const countries = require('../files/countries.json')
const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    port: 587,
    secure: false, // use SSL
    auth: {
        user: 'larocheleroy237@gmail.com',
        pass: 'rerbjxspwnrotvnt'
    }
})

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
function isAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        if (res.locals.currentUser.active == false) {
            if (req.i18n_lang == 'fr') {
                req.flash('error_msg', "Vous devez d'abord vérifier votre e-mail. Réessayez!!!");
                res.redirect('/login');
            } else if (req.i18n_lang == 'en') {
                req.flash('error_msg', "You need to verify your email first. Try again!!!");
                res.redirect('/login');
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
function checkUser(req, res, next) {
    User.findOne({ email: req.body.email })
        .then(admin => {
            if (admin.role != 'super admin' && admin.role != 'admin') {
                console.log(admin.role);
                return next();
            } else {
                if (req.i18n_lang == 'en') {
                    req.flash('error_msg', 'Only Members can login here.')
                    res.redirect('/login')
                } else if (req.i18n_lang == 'fr') {
                    req.flash('error_msg', "Seul les membres peut se connecter ici");
                    res.redirect('/login');
                }
            }
        })
    if (!req.body.email) {
        console.log(req.body.currentUserEmail)
        User.findOne({ email: req.body.currentUserEmail })
            .then(user => {
                if (!user) {
                    if (req.i18n_lang == 'fr') {
                        req.flash('error_msg', "Email invalide. Réessayez");
                        res.redirect('/login');
                    } else if (req.i18n_lang == 'en') {
                        req.flash('error_msg', "Invalid Email. Try again!!!");
                        res.redirect('/login');
                    }
                }
                if (user.active == false) {
                    if (req.i18n_lang == 'fr') {
                        req.flash('error_msg', "Vous devez d'abord vérifier votre e-mail. Réessayez!!!");
                        res.redirect('/login');
                    } else if (req.i18n_lang == 'en') {
                        req.flash('error_msg', "You need to verify your email first. Try again!!!");
                        res.redirect('/login');
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

router.get('/register', (req, res, next) => {
    return res.render('register', { layout: 'register', countries: countries });
});

router.get('/logout', (req, res, next) => {
    req.logout();
    if (req.i18n_lang == 'en') {
        req.flash('success_msg', 'You have been logged out.');
        res.redirect('/login');
    } else if (req.i18n_lang == 'fr') {
        req.flash('success_msg', 'Vous avez été déconnecté.');
        res.redirect('/login');
    }
});

router.get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] })
)

router.get('/google/callback',
    passport.authenticate('google', {
        successRedirect: '/dashboard',
        failureRedirect: '/login',
        failureFlash: 'Login Failed',
        passReqToCallback: true
    })
)

router.get('/dashboard', isAuthenticatedUser, async(req, res, next) => {
    var date = [];
    var user_number = [];
    const bookings = await Booking.find({ userId: req.user.id }).countDocuments();
    const bookings_stat = await Booking.aggregate([
        {
            $project:
            {   _id : "$req.user.id",
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
                    {_id: "$req.user.id", createdAt: "$createdAt" },
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

        res.render('dashboard', { page: 'dashboard', bookingCount: bookings, date: date, bookings_stat, req, res });
});

router.post('/register', async(req, res, next) => {
    let {
        email,
        password,
        lastName,
        firstName,
        confirmPassword,
        birthday,
        birthdayPlace,
        phone,
        gender,
        country,
        address
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
            return res.redirect('/register');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Veuillez remplir tous les champs..");
            return res.redirect('/register');
        }
    }
    if (password.length < 8) {
        req.flash('error_msg', 'The password must be greater than 8 characters.')
        res.redirect('/register');
    }
    const member = await User.findOne({ email: email })
    if (member) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', 'This email is already used.')
            res.redirect('/register');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Cet email est deja utilisé.");
            res.redirect('/register');
        }
    }
    if (!/^\d+$/.test(phone)) {
        if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Veuillez enter uniquement des chiffres pour votre numéro de téléphone.");
            return res.redirect('/register');
        } else if (req.i18n_lang == 'en') {
            req.flash('error_msg', "Please enter only numbers for your telephone number.");
            return res.redirect('/register');
        }
    }
    var regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/
    if (!regex.test(password)) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', 'Password must contain at least one lowercase character, contain at least one uppercase character, contain at least 8 characters.');
            res.redirect('/register');

        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Le mot de passe doit contenir au moins un caractère minuscule, contenir au moins un caractère majuscule, contenir au moins 8 caractères.");
            return res.redirect('/register');
        }
    }
    if (password != confirmPassword) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', 'Passwords do not match.');
            res.redirect('/register');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Les mots de passes ne correspondent pas.");
            return res.redirect('/register');
        }
    }

    let customer = {
        avatar: url,
        email: email,
        lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        birthday: birthday,
        birthdayPlace: birthdayPlace.charAt(0).toUpperCase() + birthdayPlace.slice(1),
        phone: phone,
        gender: gender,
        country: country,
        code: code,
        address: address
    };

    User.register(customer, password, (err, user) => {
        let mailOptions = {
            to: email,
            from: 'La Roche Le Roy  Restaurant <larocheleroy237@gmail.com>',
            subject: 'Email Verification',
            html: `<style>html,body { padding: 0; margin:0; }</style>
                    <div style="font-family:Arial,Helvetica,sans-serif; line-height: 1.5; font-weight: normal; font-size: 15px; color: #2F3044; min-height: 100%; margin:0; padding:0; width:100%; background-color:#edf2f7">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0 auto; padding:0; max-width:600px">
                            <tbody>
                                <tr>
                                    <td align="center" valign="center" style="text-align:center; padding: 40px">
                                        <a href="http://restaurant237.herokuapp.com" rel="noopener" target="_blank">
                                            <img src="http://restaurant237.herokuapp.com/logo/image.png" style="height: 40px" alt="logo">
                                                <tr>
                                                    <td align="left" valign="center">
                                                        <div style="text-align:left; margin: 0 20px; padding: 40px; background-color:#ffffff; border-radius: 6px">
                                                            <!--begin:Email content-->
                                                            <div style="padding-bottom: 30px; font-size: 17px;">
                                                            <center><strong>Welcome to La Roche Le Roy Restaurant!</strong></center>
                                                            </div>
                                                            <div style="padding-bottom: 30px">Hello ${firstName} ${lastName}, To activate your account, please copy and enter this code ${code} to verify your email address. Once activated, you’ll have full access to our free and premium products.</div>
                                                            <!--end:Email content-->
                                                            <div style="padding-bottom: 10px">Kind regards,
                                                            <br>La Roche Le Roy Restaurant Team. 
                                                            <tr>
                                                                <td align="center" valign="center" style="font-size: 13px; text-align:center;padding: 20px; color: #6d6e7c;">
                                                                    <p>22, Northstreet Road, Melbourne, Victoria, Australia.</p>
                                                                    <p>Copyright 2021© 
                                                                    <a href="https://restaurant237.herokuapp.com/" rel="noopener" target="_blank">La Roche Le Roy Restaurant</a>.</p>
                                                                </td>
                                                            </tr></br></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </img>
                                        </a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>`
        }
        transporter.sendMail(mailOptions, err => {
            if (err) {
                console.log(err);
            } else {
                console.log('Email sent successfully');
            }
        })
        if (req.i18n_lang == 'fr') {
            req.flash('success_msg', 'Account created successfully and email send with further instructions. Please check your mail.')
            res.redirect('/activate-account/' + user.id);
        } else if (req.i18n_lang == 'en') {
            req.flash('success_msg', 'Compte créé avec succès et email envoyé avec des instructions supplémentaires. Veuillez vérifier votre email.');
            res.redirect('/activate-account/' + user.id);
        }
    });
});

router.post('/login', checkUser, passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
}));

module.exports = router;