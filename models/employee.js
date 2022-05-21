const mongoose = require('mongoose');

let employeeSchema = new mongoose.Schema({
    avatar: String,
    email: {
        type: String
    },
    birthday: String,
    birthdayPlace: String,
    phone: {
        type: Number
    },
    salary: Number,
    address: String,
    type: {
        type: String
    },
    gender: String,
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model('Employee', employeeSchema);