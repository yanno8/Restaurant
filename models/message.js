var mongoose = require('mongoose');
var Schema = mongoose.Schema;

messageSchema = new Schema({

    name: String,
    email: String,
    content: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
})

Message = mongoose.model('Message', messageSchema);

module.exports = Message