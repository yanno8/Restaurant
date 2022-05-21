const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')
const http = require('http');
const server = http.createServer(app);
const path = require('path')
const route = require('./routes/route')
const admin = require('./routes/admin-route')
const bill = require('./routes/bill-route')
const booking = require('./routes/booking-route')
const employee = require('./routes/employee-route')
const menu = require('./routes/menu-route')
const message = require('./routes/message-route')
const user = require('./routes/user-route')
const mongoose = require('mongoose')
const session = require('express-session')
const socketIo = require('socket.io');
const Sockets = require("./socket/socket");
const passport = require('passport')
const cors = require('cors')
const LocalStrategy = require('passport-local').Strategy
var GoogleStrategy = require('passport-google-oauth2').Strategy
const User = require('./models/user')
const flash = require('connect-flash')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const i18n = require("i18n-express");
const geolang = require("geolang-express");
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const GOOGLE_CLIENT_ID = '474113980327-e0fmiqd6u1hittehdqb31gq549kka9ca.apps.googleusercontent.com'
const GOOGLE_CLIENT_SECRET = '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'

const PORT = process.env.PORT || 3000

// mongodb://127.0.0.1:27017/restaurant 

mongoose.connect('mongodb+srv://yanno08:Barcelone10@cluster.viegm.mongodb.net/restaurant?retryWrites=true&w=majority', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

// Middleware for session
app.use(session({
    secret: 'your secret',
    saveUninitialized: false,
    resave: true
}));

// i18next middleware
i18next.use(Backend).use(middleware.LanguageDetector)
    .init({
        fallbackLng: 'en',
        backend: {
            loadPath: './locales/{{lng}}/translation.json'
        }
    })

app.use(middleware.handle(i18next));

// Middleware for pages
app.use(expressLayouts);
app.set('layout login', false);
app.set('layout admin', false);
app.set('layout register', false);
app.set('layout contact', false);
app.set('layout menu', false);
app.set('layout ', false);

// Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordFeild: 'password',
        passReqToCallback: true
    },
    function(req, email, password, done) {
        User.findOne({ email: email },
            function(err, user) {
                if (!user) {
                    return done(null, false, { message: 'Invalid Email. Try again!!!' });
                }
                const active = user.active
                if (active == false) {
                    return done(null, false, { message: "You need to verify your email first. Try again!!!" });
                }
                user.authenticate(password, function(err, users, valid) {
                    if (valid) {
                        return done(null, false, { message: "Invalid Password. Try again!!!" });
                    } else if (users) {
                        return done(null, users);

                    }
                })
            }
        )

    }
));
passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "http://restaurant237.herokuapp.com/google/callback",
        passReqToCallback: true
    },
    function(req, accessToken, refreshToken, profile, done) {
        User.findOne({ email: profile.email }).then(current => {
            if (current) {
                done(null, current)
            } else {
                new User({
                    firstName: profile.given_name,
                    lastName: profile.family_name,
                    email: profile.email,
                    avatar: profile.picture,
                    account: 'social',
                    active: true
                }).save().then((user) => {
                    done(null, user)
                })
            }
        })
    }));
passport.serializeUser(function(user, done) {
    done(null, user)
});
passport.deserializeUser(function(user, done) {
    User.findById(user._id, function(err, user) {
        done(err, user);
    });
});

// middleware for internationalization
app.use(geolang({
    siteLangs: ["fr", "en"],
    cookieLangName: 'ulang'
}));

app.use(i18n({
    translationsPath: path.join(__dirname, 'languages'), // <--- use here. Specify translations files path.
    siteLangs: ["fr", "en"],
    textsVarName: 'translation'
}));

// Middleware for flash message
app.use(flash());

// Setting middleware globally
app.use((req, res, next) => {
    res.locals.success_msg = req.flash(('success_msg'))
    res.locals.error_msg = req.flash(('error_msg'))
    res.locals.error = req.flash(('error'))
    res.locals.currentUser = req.user;
    next();
})

// Setting views
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static('public'))
app.use(methodOverride('_method'))
app.use(route);
app.use(admin);
app.use(bill);
app.use(employee);
app.use(booking);
app.use(user);
app.use(menu);
app.use(message);

server.listen(PORT, () => {
    console.log('Server is listening on *:' + PORT);
});

// ajouter et supprimer un socket.id de la sauvegarde apres une nouvelle connexion

const io = socketIo(server, {
    cors: {
        origin: `http://localhost:${PORT}`,
        methods: ["GET", "POST"]
    },
    allowEIO3: true
});
const socket = new Sockets();
io.on("connection", socket.connection);
