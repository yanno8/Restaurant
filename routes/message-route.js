const express = require('express')
const router = express.Router()
const Message = require('../models/message')

// Check if user is authenticated
function isAuthenticatedAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/admin/login')
}

router.get('/messages', isAuthenticatedAdmin, (req, res, next) => {
    Message.find()
        .then(message => {
            return res.render('message', { message: message });
        })
});

router.get('/message/:id', isAuthenticatedAdmin, (req, res, next) => {
    Message.findOne()
        .then(message => {
            return res.render('messag', { message: message });
        })
});

router.get('/contact', (req, res, next) => {
    return res.render('contact', { layout: 'contact' });
});

router.post('/contact', (req, res, next) => {
    let { name, email, content } = req.body

    if (!name || !email || !content) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', "Please fill in all fields.");
            return res.redirect('/contact');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Veuillez remplir tous les champs.");
            return res.redirect('/contact');
        }
    }
    const message = new Message({
        name: name,
        content: content,
        email: email
    })
    const saved = message.save()
    if (!saved) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', 'Registration failed.');
            res.redirect('/contact');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', 'Enregistrement échoué.');
            res.redirect('/contact');
        }
    } else {
        if (req.i18n_lang == 'en') {
            req.flash('success_msg', 'Message sent successfully.');
            res.redirect('/contact');
        } else if (req.i18n_lang == 'fr') {
            req.flash('success_msg', 'Message envoyé avec succes.');
            res.redirect('/contact');
        }
    }
})

module.exports = router;