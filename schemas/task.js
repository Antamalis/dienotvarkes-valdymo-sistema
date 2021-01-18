const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema and Model
const TaskSchema = new Schema({
    name: {type: String, required: true},
    dueDate: Date,
    comments: {type: String, default: ""},
    completed: {type: Boolean, default: false}
});

//Export the model so we can use it in other files
module.exports = TaskSchema;
