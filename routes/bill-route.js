const express = require('express')
const router = express.Router()
const User = require('../models/user')
const Menu = require('../models/menu')
const Bill = require('../models/bill')
const Employee = require('../models/employee')
const employee = require('../models/employee')

// Check if user is authenticated

function isAuthenticatedAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/admin/login')
}

// Starting GET Router

router.get('/create/bill', isAuthenticatedAdmin, async(req, res, next) => {
    const waiter = await Employee.find({ type: 'Waiter' }).sort({ firstName: 1 })
    const food = await Menu.find({ quality: 'Food' }).sort({ name: 1 })
    const drink = await Menu.find({ quality: 'drink' }).sort({ name: 1 })
    return res.render('bill', { page: 'bill', waiter: waiter, food: food, drink: drink });
});

router.get('/bills', isAuthenticatedAdmin, (req, res, next) => {
    Bill.find()
        .then(user => {
            return res.render('list-bill', { page: 'bill', user: user });
        })
        .catch(err => {
            if (req.i18n_lang == 'fr') {
                req.flash('error_msg', 'Un problème est apparu lors de l\'obtention des factures')
                res.redirect('/admin/dashboard', { page: 'bill' });
            } else if (req.i18n_lang == 'en') {
                req.flash('error_msg', 'A problem arised while getting bills')
                res.redirect('/admin/dashboard', { page: 'bill' });
            }
        })
});

router.get('/bill/profile/:id', isAuthenticatedAdmin, (req, res) => {
    Bill.findOne({ _id: req.params.id })
        .then(user => {
            res.render('profil-bill', { page: 'bill', user: user });
        })
})

router.get('/print/:id', isAuthenticatedAdmin, async(req, res, next) => {

    const print = await Bill.findOne({ _id: req.params.id })
    const name = print.food
    console.log('name', name)
    const bill = await Menu.findOne({ name: name })
    console.log('bill', bill)
    return res.render('print', { page: 'print', print: print, bill: bill });
});

// Starting POST router

router.post('/create/bill', (req, res, next) => {
    let {
        firstName,
        lastName,
        amount,
        total,
        waiter,
        food,
        drink
    } = req.body

    if (!firstName || !lastName || !total || !waiter || !amount || !food || !drink) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', "Please fill in all fields.");
            return res.redirect('/create/bill');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Veuillez remplir tous les champs.");
            return res.redirect('/create/bill');
        }
    }

    const bill = new Bill({
        firstName: firstName,
        lastName: lastName,
        amount: amount,
        waiter: waiter,
        drink: drink,
        food: food,
        total: total
    });
    const saved = bill.save()
    if (!saved) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', 'Registration failed.');
            res.redirect('/create/bill');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', 'Enregistrement échoué.');
            res.redirect('/create/bill');
        }
    } else {
        if (req.i18n_lang == 'en') {
            req.flash('success_msg', 'Bill created successfully.');
            res.redirect('/create/bill');
        } else if (req.i18n_lang == 'fr') {
            req.flash('success_msg', 'Facture créé avec succes.');
            res.redirect('/create/bill');
        }
    }
});

// Starting PUT Router

router.put('/bill/profile/:id', (req, res) => {
    let search = { _id: req.params.id }

    Bill.updateOne(search, {
            $set: {
                total: req.body.total,
                drink: req.body.drink,
                firstName: req.body.firstName,
                food: req.body.food,
                waiter: req.body.waiter,
                amount: req.body.amount,
                lastName: req.body.lastName
            }
        })
        .then(user => {
            if (req.i18n_lang == 'en') {
                req.flash('success_msg', 'Employee updated successfully.')
                res.redirect('/employee/profile/' + req.params.id)
            } else if (req.i18n_lang == 'fr') {
                req.flash('success_msg', 'Employé mis à jour avec succes.')
                res.redirect('/employee/profile/' + req.params.id)
            }
        })
        .catch(err => {
            if (req.i18n_lang == 'en') {
                req.flash('error_msg', 'Update failed.')
                res.redirect('/employee/profile/' + req.params.id)
            } else if (req.i18n_lang == 'fr') {
                req.flash('error_msg', 'Mise à jour échoué.')
                res.redirect('/employee/profile/' + req.params.id)
            }
        })
})

module.exports = router;