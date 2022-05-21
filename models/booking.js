var mongoose = require('mongoose');
var Schema = mongoose.Schema;

bookingSchema = new Schema({
        userId: { 
            type: Schema.Types.ObjectId, 
            ref: 'user' 
        },
        firstName: {
            type: String
        },
        lastName: {
            type: String
        },
        email: {
            type: String
        },
        phone: {
            type: Number
        },
        time: {
            type: String
        },
        city: String,
        address: String,
        type: {
            type: String
        },
        number: Number,
        title: String,
        food: String,
        drink: String,
        date: {
            type: String
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
    }),
    Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;