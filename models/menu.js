var mongoose = require('mongoose');
var Schema = mongoose.Schema;

menuSchema = new Schema({
    quality: String,
    avatar: String,
    name: {
        type: String
    },
    type: {
        type: String
    },
    description: String,
    time: String,
    price: {
        type: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

Menu = mongoose.model('Menu', menuSchema);

module.exports = Menu