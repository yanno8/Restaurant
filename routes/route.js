const express = require('express')
const router = express.Router()
const User = require('../models/user')
const Booking = require('../models/booking')
const nodemailer = require("nodemailer")
const crypto = require('crypto')
const async = require('async')
const multer = require('multer')
const path = require('path')


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

// Check if user is authenticated
function isAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/user/login')
}

function isAuthenticatedAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/admin/login')
}

// GET Router
router.get('/', (req, res, next) => {
    return res.render('index', { layout: 'index' });
});

router.get('/report', isAuthenticatedAdmin, async(req, res, next) => {

    const booking = await Booking.aggregate([{ $project: { createdAt: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } }, { $group: { _id: { createdAt: "$createdAt" }, number: { $sum: 1 } } }, { $project: { _id: 0, createdAt: "$_id.createdAt", number: 1 } }, { $sort: { "createdAt": -1 } }])
        // console.log('Booking', booking)
    const table = await Booking.aggregate([{ $match: { type: 'Booking Table' } }, { $project: { createdAt: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } }, { $group: { _id: { createdAt: "$createdAt" }, number: { $sum: 1 } } }, { $project: { _id: 0, createdAt: "$_id.createdAt", number: 1 } }, { $sort: { "createdAt": -1 } }])
    const food = await Booking.aggregate([{ $match: { type: 'Booking Food' } }, { $project: { createdAt: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } }, { $group: { _id: { createdAt: "$createdAt" }, number: { $sum: 1 } } }, { $project: { _id: 0, createdAt: "$_id.createdAt", number: 1 } }, { $sort: { "createdAt": -1 } }])
    const birthday = await Booking.aggregate([{ $match: { type: 'Booking Birthday Event' } }, { $project: { createdAt: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } }, { $group: { _id: { createdAt: "$createdAt" }, number: { $sum: 1 } } }, { $project: { _id: 0, createdAt: "$_id.createdAt", number: 1 } }, { $sort: { "createdAt": -1 } }])
    const wedding = await Booking.aggregate([{ $match: { type: 'Booking Wedding Event' } }, { $project: { createdAt: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } }, { $group: { _id: { createdAt: "$createdAt" }, number: { $sum: 1 } } }, { $project: { _id: 0, createdAt: "$_id.createdAt", number: 1 } }, { $sort: { "createdAt": -1 } }])
    const business = await Booking.aggregate([{ $match: { type: 'Booking Business Dinner Event' } }, { $project: { createdAt: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } }, { $group: { _id: { createdAt: "$createdAt" }, number: { $sum: 1 } } }, { $project: { _id: 0, createdAt: "$_id.createdAt", number: 1 } }, { $sort: { "createdAt": -1 } }])
    return res.render('report', { table: table, food: food, birthday: birthday, wedding: wedding, business: business, booking: booking });

});

router.get('/activate-account/:id', (req, res, next) => {
    User.findOne({ _id: req.params.id })
        .then(user => {
            return res.render('verification', { layout: 'verification', user: user });
        })
});

router.get('/validation/:id', (req, res, next) => {
    User.findOne({ _id: req.params.id })
        .then(user => {
            return res.render('validation', { layout: 'validation', user: user });
        })
});

router.get('/chat', (req, res, next) => {
    return res.render('chat');
});

router.get('/login', (req, res, next) => {
    return res.render('login', { layout: 'login' });
});

router.get('/customers', isAuthenticatedAdmin, (req, res, next) => {
    const role = 'customer'
    User.find({ role: role })
        .then(user => {
            return res.render('list-customer', { page:'customer', user: user });
        })
        .catch(err => {
            if (req.i18n_lang == 'fr') {
                req.flash('error_msg', 'Un problème est apparu lors de l\'obtention des clients')
                res.redirect('/admin/dashboard', { page:'customer' });
            } else if (req.i18n_lang == 'en') {
                req.flash('error_msg', 'A problem arised while getting customers')
                res.redirect('/admin/dashboard', { page:'customer' });
            }
        })
});

router.get('/profile/:id', isAuthenticatedAdmin, (req, res) => {
    User.findOne({ _id: req.params.id })
        .then(user => {
            return res.render('profile', { page:'profile', user: user });
        })
})

router.get('/calendar', (req, res, next) => {
    return res.render('calendar', { layout: 'calendar' });
});

router.get('/event', (req, res, next) => {
    return res.render('event');
});

router.get('/forgot-password', (req, res, next) => {
    return res.render('forgot-password', { layout: 'forgot-password' });
});

router.get('/new-password/:id', (req, res, next) => {
    return res.render('new-password', { layout: 'new-password', user: user });
});

// POST router

router.post('/activate-account/:id', async(req, res, next) => {
    const code = req.body.code
    const user = await User.findOne({ code: code })
    if (code != user.code) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', 'Incorrect activation code.')
            res.redirect('/activate-account/' + user.id);
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Code d'activation incorrect")
            res.redirect('/activate-account/' + user.id);
        }
    } else {
        user.active = true
        const activated = await user.save()
        if (req.i18n_lang == 'en') {
            req.flash('success_msg', 'Email verified successfully.');
            res.redirect('/login');
        } else if (req.i18n_lang == 'fr') {
            req.flash('success_msg', 'Email verifié avec succes.');
            res.redirect('/login');
        }
    }
})

router.post('/forgot-password', (req, res, next) => {
    let email = req.body.email
    if (!email) {
        if (req.i18n_lang == 'fr') {
            req.flash('error', 'Veillez entrer votre adresse mail');
            res.redirect('/forgot-password');
        } else if (req.i18n_lang == 'en') {
            req.flash('error', 'Please enter your email address');
            res.redirect('/forgot-password');
        }
    }
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                if (req.i18n_lang == 'fr') {
                    req.flash('error', "L'utilisateur n'existe pas avec cet adresse email.");
                    return res.redirect('/forgot-password');
                } else if (req.i18n_lang == 'en') {
                    req.flash('error', "A user does not exist with this email address.");
                    return res.redirect('/forgot-password');
                }
            }
            const resetCode = randomNumber(192021, 933972);
            var code = resetCode.toString();
            if (code.length > 6) {
                user.resetCode = code.substring(0, 6);
            } else {
                user.resetCode = code;
            }

            user.save()
                .then(user => {
                    return next();
                })
                .catch(err => {
                    if (req.i18n_lang == 'fr') {
                        req.flash('error', "Une erreur s'est produite, veuillez réessayer");
                        res.redirect('/forgot-password');
                    } else if (req.i18n_lang == 'en') {
                        req.flash('error', "An error occured, please try again");
                        res.redirect('/forgot-password');
                    }
                });

            let mailOptions = {
                to: email,
                from: 'La Roche Le Roy  Restaurant <larocheleroy237@gmail.com>',
                subject: 'Reset Password',
                html: `<style>
                html,
                body {
                    padding: 0;
                    margin: 0;
                }
            </style>
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
                                                    <strong>Hello ${user.firstName} ${user.lastName}!</strong>
                                                </div>
                                                <div style="padding-bottom: 30px">You are receiving this email because we received a password reset request for your account. To proceed with the password reset please copy and enter this code: ${resetCode}</div>
                                                <!--end:Email content-->
                                                <div style="padding-bottom: 10px">Kind regards,
                                                    <br>La Roche Le Roy Restaurant Team.
                                                    <tr>
                                                        <td align="center" valign="center" style="font-size: 13px; text-align:center;padding: 20px; color: #6d6e7c;">
                                                            <p>22, Northstreet Road, Melbourne, Victoria, Australia.</p>
                                                            <p>Copyright 2021©
                                                                <a href="https://restaurant237.herokuapp.com/" rel="noopener" target="_blank">La Roche Le Roy Restaurant</a>.</p>
                                                        </td>
                                                    </tr>
                                                    </br>
                                                </div>
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
                    res.redirect('/validation/' + user.id);
                }
            })
        })
        .catch(err => {
            if (req.i18n_lang == 'fr') {
                req.flash('error', "Une erreur s'est produite lors de l'identification de l'utilisateur.");
                res.redirect('/forgot-password');
            } else if (req.i18n_lang == 'en') {
                req.flash('error', "An error occured while identifying the user.");
                res.redirect('/forgot-password');
            }
        })
});

router.post('/validation/:id', (req, res, next) => {
    var code = req.body.code
    User.findOne({ resetCode: code })
        .then(user => {
            if (code != user.code) {
                if (req.i18n_lang == 'en') {
                    req.flash('error_msg', 'Incorrect verification code.')
                    res.redirect('/validation/' + user.id);
                } else if (req.i18n_lang == 'fr') {
                    req.flash('error_msg', "Code de verification incorrect")
                    res.redirect('/validation/' + user.id);
                }
            }
            res.redirect('/new-password/' + user.id);
        })
})

router.post('/new-password/:id', (req, res) => {
    let id = req.params.id
    let { password, confirmPassword } = req.body;
    User.findOne({ id: id })
        .then(admin => {
            if (!admin) {
                if (req.i18n_lang == 'fr') {
                    req.flash('error', "Cet utilisateur n'existe pas, veuillez réessayer.");
                    return res.redirect('/forgot-password');
                } else if (req.i18n_lang == 'en') {
                    req.flash('error', "This user does not exist, please try again.");
                    return res.redirect('/forgot-password');
                }
            }
            var regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/
            if (!regex.test(password)) {
                if (req.i18n_lang == 'en') {
                    req.flash('error_msg', 'Password must contain at least one lowercase character, contain at least one uppercase character, contain at least 8 characters.');
                    res.redirect('/new-password/' + admin.id);

                } else if (req.i18n_lang == 'fr') {
                    req.flash('error_msg', "Le mot de passe doit contenir au moins un caractère minuscule, contenir au moins un caractère majuscule, contenir au moins 8 caractères.");
                    return res.redirect('/new-password/' + admin.id);
                }
            }
            if (password != confirmPassword) {
                if (req.i18n_lang == 'fr') {
                    req.flash('error', "Les mots de passes ne correspondent pas.");
                    return res.redirect('/new-password/' + admin.id);
                } else if (req.i18n_lang == 'en') {
                    req.flash('error', "Passwords do not match.");
                    return res.redirect('/new-password/' + admin.id);
                }
            }

            let mailOptions = {
                to: admin.email,
                from: 'La Roche Le Roy  Restaurant <larocheleroy237@gmail.com>',
                subject: 'Reset Password',
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
                                                            <strong>Hello!</strong>
                                                        </div>
                                                        <div style="padding-bottom: 20px">Your La Roche Le Roy Restaurant password was just changed.</div>
                                                        <div style="padding-bottom: 40px">If you didn't change your password, please contact our 
                                                        <a href="https://restaurant237.herokuapp.com/contact" rel="noopener" target="_blank" style="text-decoration:none;color: #00A3FF; font-weight: bold">support team</a>. Your security is very important to us!</div>
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
                    admin.save();
                    if (req.i18n_lang == 'fr') {
                        req.flash('success_msg', "Mot de passe mis à jour avec succès.");
                        return res.redirect('/login');
                    } else if (req.i18n_lang == 'en') {
                        req.flash('success_msg', "Password successfully updated.");
                        return res.redirect('/login');
                    }
                }
            })
        })
        .catch(err => {
            if (req.i18n_lang == 'fr') {
                req.flash('error', "Cet utilisateur n'existe pas.");
            } else if (req.i18n_lang == 'en') {
                req.flash('error', "This user does not exist.");
            }
        });

});

// PUT Router

router.put('/profile/:id', upload.single('avatar'), (req, res) => {
    let search = { _id: req.params.id }
    const file = req.file
    var url;
    var role;
    var type;
    console.log("File: ", file);

    if (!req.body.role) {
        role = req.body.hiddenRole;
    } else {
        role = req.body.role;
    }
    if (!req.body.type) {
        type = req.body.hiddenType;
    } else {
        type = req.body.type;
    }

    if (!file) {
        User.updateOne(search, {
                $set: {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    birthday: req.body.birthday,
                    birthdayPlace: req.body.birthdayPlace,
                    phone: req.body.phone,
                    address: req.body.address,
                    role: role,
                    type: type,
                    country: req.body.country
                }
            })
            .then(user => {
                if (req.i18n_lang == 'en') {
                    req.flash('success_msg', 'Details updated successfully.')
                    res.redirect('/profile/' + req.params.id)
                } else if (req.i18n_lang == 'fr') {
                    req.flash('success_msg', 'Détails mis à jour avec succes.')
                    res.redirect('/profile/' + req.params.id)
                }
            })
            .catch(err => {
                if (req.i18n_lang == 'en') {
                    req.flash('error_msg', 'Update failed.')
                    res.redirect('/profile/' + req.params.id)
                } else if (req.i18n_lang == 'fr') {
                    req.flash('error_msg', 'Mise à jour échoué.')
                    res.redirect('/profile/' + req.params.id)
                }
            })
    } else {
        console.log("File: ", file);
        url = file.path.replace('public', '')
        console.log(url);

        User.updateOne(search, {
                $set: {
                    avatar: url,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    birthday: req.body.birthday,
                    birthdayPlace: req.body.birthdayPlace,
                    phone: req.body.phone,
                    address: req.body.address,
                    role: role,
                    type: type,
                    country: req.body.country
                }
            })
            .then(user => {
                if (req.i18n_lang == 'en') {
                    req.flash('success_msg', 'Details updated successfully.')
                    res.redirect('/profile/' + req.params.id)
                } else if (req.i18n_lang == 'fr') {
                    req.flash('success_msg', 'Détails mis à jour avec succes.')
                    res.redirect('/profile/' + req.params.id)
                }
            })
            .catch(err => {
                if (req.i18n_lang == 'en') {
                    req.flash('error_msg', 'Update failed.')
                    res.redirect('/profile/' + req.params.id)
                } else if (req.i18n_lang == 'fr') {
                    req.flash('error_msg', 'Mise à jour échoué.')
                    res.redirect('/profile/' + req.params.id)
                }
            })
    }
})

// DELETE Router
router.delete('/delete/:id', (req, res) => {
    let search = { _id: req.params.id }

    User.findByIdAndDelete(search)
        .then(user => {
            console.log(user)
            if (user.role == 'admin') {
                if (req.i18n_lang == 'en') {
                    req.flash('success_msg', 'Administrator deleted successfully.')
                    res.redirect('/admins')
                } else if (req.i18n_lang == 'fr') {
                    req.flash('success_msg', 'Administrateur supprimé avec succes.')
                    res.redirect('/admins')
                }
            }
            if (user.role == 'customer') {
                if (req.i18n_lang == 'en') {
                    req.flash('success_msg', 'Customer deleted successfully.')
                    res.redirect('/customers')
                } else if (req.i18n_lang == 'fr') {
                    req.flash('success_msg', 'Client supprimé avec succes.')
                    res.redirect('/customers')
                }
            }
        })
        .catch(err => {
            if (user.role == 'admin') {
                if (req.i18n_lang == 'en') {
                    req.flash('error_msg', 'Delete failed.')
                    res.redirect('/admins')
                } else if (req.i18n_lang == 'fr') {
                    req.flash('error_msg', 'Echec de la suppression.')
                    res.redirect('/admins')
                }
            }
            if (user.role == 'customer') {
                if (req.i18n_lang == 'en') {
                    req.flash('error_msg', 'Delete failed.')
                    res.redirect('/customers')
                } else if (req.i18n_lang == 'fr') {
                    req.flash('error_msg', 'Echec de la suppression.')
                    res.redirect('/customers')
                }
            }
        })
})


module.exports = router;