const express = require('express')
const router = express.Router()
const User = require('../models/user')
const Employee = require('../models/employee')
const multer = require('multer')
const path = require('path')

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

router.get('/create/employee', isAuthenticatedAdmin, (req, res, next) => {
    return res.render('employee', { page: 'employee' });
});

router.get('/employees', isAuthenticatedAdmin, (req, res, next) => {
    Employee.find().sort({ firstName: 1 })
        .then(user => {
            return res.render('list-employee', { page: 'employee', user: user });
        })
        .catch(err => {
            if (req.i18n_lang == 'fr') {
                req.flash('error_msg', 'Un problème est apparu lors de l\'obtention des employées')
                res.redirect('/admin/dashboard', { page: 'employee' });
            } else if (req.i18n_lang == 'en') {
                req.flash('error_msg', 'A problem arised while getting employees')
                res.redirect('/admin/dashboard', { page: 'employee' });
            }
        })
});

router.get('/employee/profile/:id', isAuthenticatedAdmin, (req, res) => {
    Employee.findOne({ _id: req.params.id })
        .then(user => {
            res.render('profil-employee', { page: 'employee', user: user });
        })
})

router.post('/create/employee', (req, res, next) => {
    let {
        email,
        address,
        lastName,
        firstName,
        phone,
        type,
        salary,
        birthday,
        birthdayPlace,
        gender
    } = req.body


    if (!firstName || !lastName || !email || !salary || !phone || !type || !gender || !address || !birthday || !birthdayPlace) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', "Please fill in all fields.");
            return res.redirect('/create/employee');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Veuillez remplir tous les champs.");
            return res.redirect('/create/employee');
        }
    }

    var url;
    if (type == "Waiter") {
        url = "waiter.jpg ";
    } else if (type == "Chef" || type == "Cooker") {
        url = "cooker.jpg ";
    } else if (type == "Deliver") {
        url = "delivery.png ";
    }

    const employee = new Employee({
        avatar: url,
        email: email,
        address: address,
        type: type,
        lastName: lastName,
        firstName: firstName,
        gender: gender,
        phone: phone,
        salary: salary,
        birthday: birthday,
        birthdayPlace: birthdayPlace
    });
    const saved = employee.save()
    if (!saved) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', 'Registration failed.');
            res.redirect('/create/employee');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', 'Enregistrement échoué.');
            res.redirect('/create/employee');
        }
    } else {
        if (req.i18n_lang == 'en') {
            req.flash('success_msg', 'Employee created successfully.');
            res.redirect('/create/employee');
        } else if (req.i18n_lang == 'fr') {
            req.flash('success_msg', 'Employée créé avec succes.');
            res.redirect('/create/employee.');
        }
    }
});

router.put('/employee/profile/:id', (req, res) => {
    let search = { _id: req.params.id }

    Employee.updateOne(search, {
            $set: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                birthday: req.body.birthday,
                birthdayPlace: req.body.birthdayPlace,
                phone: req.body.phone,
                address: req.body.address,
                salary: req.body.salary
            }
        })
        .then(user => {
            if (req.i18n_lang == 'en') {
                req.flash('success_msg', 'Employees updated successfully.')
                res.redirect('/employee/profile/' + req.params.id)
            } else if (req.i18n_lang == 'fr') {
                req.flash('success_msg', 'Employés modifiés avec succes.')
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

router.delete('/employee/delete/:id', (req, res) => {
    let search = { _id: req.params.id }

    Employee.deleteOne(search)
        .then(user => {
            if (req.i18n_lang == 'en') {
                req.flash('success_msg', 'Employee deleted successfully.')
                res.redirect('/employee')
            } else if (req.i18n_lang == 'fr') {
                req.flash('success_msg', 'Employé supprimé avec succes.')
                res.redirect('/employee')
            }
        })
        .catch(err => {
            if (req.i18n_lang == 'en') {
                req.flash('error_msg', 'Delete failed.')
                res.redirect('/employee')
            } else if (req.i18n_lang == 'fr') {
                req.flash('error_msg', 'Echec de la suppression.')
                res.redirect('/employee')
            }
        })
});

module.exports = router;