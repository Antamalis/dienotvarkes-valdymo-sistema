const mongoose = require('mongoose');
const CalendarSchema = require('../schemes/calendar')
const Schema = mongoose.Schema;

//Create Schema and Model
const UserSchema = new Schema({
    email: {type: String, unique: true, required: true},
    username: {type: String, unique: true, required: true},
    password: {type: String, required: true},
    calendar: {type: CalendarSchema, default: {}},
    projects: {type: [{
        projectId: {type: String, required: true},
        projectTitle: {type: String, required: true}
    }]}
});

//Export the model so we can use it in other files
const User = mongoose.model('user', UserSchema);
module.exports = User;