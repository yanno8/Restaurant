var mongoose = require('mongoose');
var Schema = mongoose.Schema;

billSchema = new Schema({
        amount: {
            type: Number
        },
        total: {
            type: Number
        },
        drink: {
            type: String
        },
        waiter: {
            type: String
        },
        food: {
            type: String
        },
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
    }),
    Bill = mongoose.model('Bill', billSchema)

module.exports = Bill;