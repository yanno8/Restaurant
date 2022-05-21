const express = require('express')
const router = express.Router()
const Menu = require('../models/menu')
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

function isAuthenticatedAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/admin/login')
}

router.get('/menus', isAuthenticatedAdmin, (req, res, next) => {
    Menu.find().sort({ name: 1 })
        .then(menu => {
            return res.render('list-menu', { page:"menu", menu: menu });
        })
});

router.get('/menu/profile/:id', isAuthenticatedAdmin, (req, res) => {
    Menu.findOne({ _id: req.params.id })
        .then(user => {
            res.render('profil-menu', { page:"menu", user: user });
        })
})

router.get('/menu', (req, res, next) => {
    return res.render('menu', { layout: 'menu' });
});

router.get('/create/menu', isAuthenticatedAdmin, (req, res, next) => {
    return res.render('create-menu', { page:"menu" });
});

router.get('/drink', (req, res, next) => {
    Menu.find({ type: 'Drink Menu' }).sort({ price: 1 }).sort({ name: 1 })
        .then(menu => {
            return res.render('drink', { layout: 'drink', menu: menu });
        })
});

router.get('/dessert', (req, res, next) => {
    Menu.find({ type: 'Dessert Menu' }).sort({ price: 1 }).sort({ name: 1 })
        .then(menu => {
            return res.render('dessert', { layout: 'dessert', menu: menu });
        })
});

router.get('/main-course', (req, res, next) => {
    Menu.find({ type: 'Main Course Menu' }).sort({ price: 1 }).sort({ name: 1 })
        .then(menu => {
            return res.render('main_course', { layout: 'main_course', menu: menu });
        })
});

router.get('/starter-dish', (req, res, next) => {
    Menu.find({ type: 'Starter Dish Menu' }).sort({ price: 1 }).sort({ name: 1 })
        .then(menu => {
            return res.render('starter_dish', { layout: 'starter_dish', menu: menu });
        })
});

router.get('/fast-food', (req, res, next) => {
    Menu.find({ type: 'Fast-food Menu' }).sort({ price: 1 }).sort({ name: 1 })
        .then(menu => {
            return res.render('fast-food', { layout: 'fast-food', menu: menu });
        })
});

router.get('/coffee', (req, res, next) => {
    Menu.find({ type: 'Coffee Menu' }).sort({ price: 1 }).sort({ name: 1 })
        .then(menu => {
            return res.render('coffee', { layout: 'coffee', menu: menu });
        })
});

router.post('/create/menu', upload.single('avatar'), (req, res, next) => {
    var url;
    let {
        type,
        price,
        name,
        description,
        quality,
        time
    } = req.body


    if (!type || !price || !name || !description || !quality || !time) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', "Please fill in all fields.");
            return res.redirect('/create/menu');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', "Veuillez remplir tous les champs.");
            return res.redirect('/create/menu');
        }
    }

    const avatar = req.file
    url = avatar.path.replace('public', '')
    console.log('file:', url)

    const menu = new Menu({
        avatar: url,
        name: name,
        price: price,
        type: type,
        description: description,
        quality: quality,
        time: time
    });
    const saved = menu.save()
    if (!saved) {
        if (req.i18n_lang == 'en') {
            req.flash('error_msg', 'Registration failed.');
            res.redirect('/create/menu');
        } else if (req.i18n_lang == 'fr') {
            req.flash('error_msg', 'Enregistrement échoué.');
            res.redirect('/create/menu');
        }
    } else {
        if (req.i18n_lang == 'en') {
            req.flash('success_msg', 'Menu created successfully.');
            res.redirect('/create/menu');
        } else if (req.i18n_lang == 'fr') {
            req.flash('success_msg', 'Menu créé avec succes.');
            res.redirect('/create/menu.');
        }
    }
});

router.put('/menu/profile/:id', upload.single('avatar'), (req, res) => {
    let search = { _id: req.params.id }
    const file = req.file
    var url;
    if (!file) {
        Menu.updateOne(search, { $set: { name: req.body.name, time: req.body.time, price: req.body.price, description: req.body.description } })
            .then(user => {
                if (req.i18n_lang == 'en') {
                    req.flash('success_msg', 'Details updated successfully.')
                    res.redirect('/menu/profile/' + req.params.id)
                } else if (req.i18n_lang == 'fr') {
                    req.flash('success_msg', 'Détails mis à jour avec succes.')
                    res.redirect('/menu/profile/' + req.params.id)
                }
            })
            .catch(err => {
                if (req.i18n_lang == 'en') {
                    req.flash('error_msg', 'Update failed.')
                    res.redirect('/menu/profile/' + req.params.id)
                } else if (req.i18n_lang == 'fr') {
                    req.flash('error_msg', 'Mise à jour échoué.')
                    res.redirect('/menu/profile/' + req.params.id)
                }
            })
    } else {
        url = file.path.replace('public', '')
        Menu.updateOne(search, { $set: { avatar: url, name: req.body.name, time: req.body.time, price: req.body.price, description: req.body.description } })
            .then(user => {
                if (req.i18n_lang == 'en') {
                    req.flash('success_msg', 'Details updated successfully.')
                    res.redirect('/menu/profile/' + req.params.id)
                } else if (req.i18n_lang == 'fr') {
                    req.flash('success_msg', 'Détails mis à jour avec succes.')
                    res.redirect('/menu/profile/' + req.params.id)
                }
            })
            .catch(err => {
                if (req.i18n_lang == 'en') {
                    req.flash('error_msg', 'Update failed.')
                    res.redirect('/menu/profile/' + req.params.id)
                } else if (req.i18n_lang == 'fr') {
                    req.flash('error_msg', 'Mise à jour échoué.')
                    res.redirect('/menu/profile/' + req.params.id)
                }
            })
    }
})

router.delete('/menu/delete/:id', (req, res) => {
    let search = { _id: req.params.id }

    Menu.deleteOne(search)
        .then(user => {
            if (req.i18n_lang == 'en') {
                req.flash('success_msg', 'Menu deleted successfully.')
                res.redirect('/menu')
            } else if (req.i18n_lang == 'fr') {
                req.flash('success_msg', 'Ménu supprimé avec succes.')
                res.redirect('/menu')
            }
        })
        .catch(err => {
            if (req.i18n_lang == 'en') {
                req.flash('error_msg', 'Delete failed.')
                res.redirect('/menu')
            } else if (req.i18n_lang == 'fr') {
                req.flash('error_msg', 'Echec de la suppression.')
                res.redirect('/menu')
            }
        })
});

module.exports = router;