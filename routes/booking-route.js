const express = require('express')
const router = express.Router()
const User = require('../models/user')
const Menu = require('../models/menu')
const Booking = require('../models/booking')
const nodemailer = require("nodemailer")
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
function isAuthenticatedAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/admin/login')
}

// Starting GET Router

router.get('/create/booking', async(req, res, next) => {
    const food = await Menu.find({ quality: 'Food' }).sort({ name: 1 })
    const drink = await Menu.find({ quality: 'Drink' }).sort({ name: 1 })
    return res.render('booking', { page: 'booking', food: food, drink: drink });
});

router.get('/my-booking', (req, res, next) => {
    Booking.find({ userId: req.user.id })
        .then(booking => {
            return res.render('myBooking', { page: 'booking', booking: booking });
        })
        .catch(err => {
            if (req.i18n_lang == 'fr') {
                req.flash('error_msg', 'Un problème est apparu lors de l\'obtention de mes reservations')
                res.redirect('/admin/dashboard', { page: 'booking' });
            } else if (req.i18n_lang == 'en') {
                req.flash('error_msg', 'A problem arised while getting my booking')
                res.redirect('/admin/dashboard', { page: 'booking' });
            }
        })
});

router.get('/booking', isAuthenticatedAdmin, (req, res, next) => {
    Booking.find()
        .then(user => {
            return res.render('list-booking', { page: 'booking', user: user });
        })
        .catch(err => {
            if (req.i18n_lang == 'fr') {
                req.flash('error_msg', 'Un problème est apparu lors de l\'obtention des reservations')
                res.redirect('/admin/dashboard', { page: 'booking' });
            } else if (req.i18n_lang == 'en') {
                req.flash('error_msg', 'A problem arised while getting booking')
                res.redirect('/admin/dashboard', { page: 'booking' });
            }
        })
});

router.get('/booking/profile/:id', isAuthenticatedAdmin, (req, res) => {
    Booking.findOne({ _id: req.params.id })
        .then(user => {
            res.render('profil-booking', { page: 'booking', user: user });
        })
})

// Starting POST router

router.post('/create/booking', (req, res, next) => {
    let {
        email,
        title,
        date,
        drink,
        lastName,
        firstName,
        phone,
        city,
        time,
        food,
        number,
        address,
        type
    } = req.body;


    if (!firstName || !lastName || !title || !date || !phone || !time || !city || !address || !type || !number || !drink || !food) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', "Please fill in all fields.");
            return res.redirect('/create/booking');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Veuillez remplir tous les champs.");
            return res.redirect('/create/booking');
        }
    }

    if (!/^\d+$/.test(phone)) {
        if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Veuillez enter uniquement des chiffres pour votre numéro de téléphone.");
            return res.redirect('/create/booking');
        } else if (req.i18n_lang == 'en') {
            req.flash('error_msg', "Please enter only numbers for your telephone number.");
            return res.redirect('/create/booking');
        }
    }

    const booking = new Booking({
        email: email,
        title: title,
        drink: drink,
        date: date,
        lastName: lastName,
        firstName: firstName,
        phone: phone,
        city: city,
        time: time,
        food: food,
        number: number,
        address: address,
        userId: req.user.id,
        type: type
    });

    let mailOptions = {
        to: email,
        from: 'La Roche Le Roy  Restaurant <larocheleroy237@gmail.com>',
        subject: 'Booking Confirmation',
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
                                                    <div style="padding-bottom: 30px">Hello ${title} ${firstName} ${lastName}, Thank you for making a reservation. We are expecting you on ${date} at ${time}. We look forward to your visit and hope we will be enjoying your meal experience in our restaurant as much as we will be enjoying your company.</div>
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
        console.log(err);
        console.log('Email sent successfully');
    })

    const saved = booking.save()
    if (!saved) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', 'Registration failed.');
            res.redirect('/create/booking');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', 'Enregistrement échoué.');
            res.redirect('/create/booking');
        }
    } else {
        if (req.i18n_lang == 'en') {
            req.flash('success_msg', 'Booking successfully completed.');
            res.redirect('/create/booking');
        } else if (req.i18n_lang == 'fr') {
            req.flash('success_msg', 'Reservation effectuée avec succes.');
            res.redirect('/create/booking');
        }
    }
});

// Starting PUT router
router.put('/booking/profile/:id', (req, res) => {
    let search = { _id: req.params.id }
    console.log('hdjfdnf:', req.body)
    User.updateOne(search, { $set: { title: req.body.title, firstName: req.body.firstName, lastName: req.body.lastName, type: req.body.type, email: req.body.email, date: req.body.date, time: req.body.time, phone: req.body.phone, address: req.body.address, food: req.body.food, drink: req.body.drink } })
        .then(user => {
            if (req.i18n_lang == 'en') {
                req.flash('success_msg', 'Details updated successfully.')
                res.redirect('/booking/profile/' + req.params.id)
            } else if (req.i18n_lang == 'fr') {
                req.flash('success_msg', 'Détails mis à jour avec succès.')
                res.redirect('/booking/profile/' + req.params.id)
            }
        })
        .catch(err => {
            if (req.i18n_lang == 'en') {
                req.flash('error_msg', 'Update failed.')
                res.redirect('/booking/profile/' + req.params.id)
            } else if (req.i18n_lang == 'fr') {
                req.flash('error_msg', 'Mise à jour échoué.')
                res.redirect('/booking/profile/' + req.params.id)
            }
        })
})

// Starting DELETE router
router.delete('/booking/delete/:id', (req, res) => {
    let search = { _id: req.params.id }

    Booking.deleteOne(search)
        .then(user => {
            if (req.i18n_lang == 'en') {
                req.flash('success_msg', 'Booking deleted successfully.')
                res.redirect('/booking')
            } else if (req.i18n_lang == 'fr') {
                req.flash('success_msg', 'Reservation supprimée avec succes.')
                res.redirect('/booking')
            }
        })
        .catch(err => {
            if (req.i18n_lang == 'en') {
                req.flash('error_msg', 'Delete failed.')
                res.redirect('/booking')
            } else if (req.i18n_lang == 'fr') {
                req.flash('error_msg', 'Echec de la suppression.')
                res.redirect('/booking')
            }
        })
});

module.exports = router;