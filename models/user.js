const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

let userSchema = new mongoose.Schema({
    account: {
        type: String,
        default: "normal"
    },
    avatar: String,
    email: String,
    password: {
        type: String,
        select: false
    },
    birthday: String,
    birthdayPlace: String,
    phone: {
        type: Number
    },
    address: String,
    type: String,
    googleId: String,
    role: {
        type: String,
        default: "customer"
    },
    country: String,
    gender: String,
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    active: {
        type: Boolean,
        default: false
    },
    code: Number,
    confirmPassword: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
})

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', userSchema);