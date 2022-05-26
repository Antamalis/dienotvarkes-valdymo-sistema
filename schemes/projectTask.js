const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema and Model
const ProjectTaskSchema = new Schema({
    name: {type: String, required: true},
    dueDate: { type: Number },
    comments: {type: String, default: ""},
    completed: {type: Boolean, default: false},
    assingedTo: {type: String}
});

//Export the model so we can use it in other files
module.exports = ProjectTaskSchema;
