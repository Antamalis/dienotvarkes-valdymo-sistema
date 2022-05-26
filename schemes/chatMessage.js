const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema and Model
const ChatMessageSchema = new Schema({
    senderId: {type: String, required: true},
    senderName: {type: String, required: true},
    content: {type: String, required: true}
});

//Export the model so we can use it in other files
module.exports = ChatMessageSchema;
