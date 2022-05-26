const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema and Model
const ProjectMemberSchema = new Schema({
    userId: {type: String, required: true},
    name: {type: String, required: true},
    isCreator: {type: Boolean, default: 0}
});

//Export the model so we can use it in other files
module.exports = ProjectMemberSchema;
