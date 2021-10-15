const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const TaskSchema = require('./task')

//Create Schema and Model
const CalendarSchema = new Schema({
    totalTasks: {type: Number, default: 0},
    tasks: [TaskSchema]
});

//Export the model so we can use it in other files
module.exports = CalendarSchema;
