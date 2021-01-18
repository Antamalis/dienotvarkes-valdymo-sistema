const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema and Model
const UserSchema = new Schema({
    email: String,
    username: String,
    password: String
});

//Export the model so we can use it in other files
const User = mongoose.model('user', UserSchema);
module.exports = User;
