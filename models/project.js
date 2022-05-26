const mongoose = require('mongoose');
const ProjectMemberSchema = require('../schemes/projectMember')
const ChatMessageSchema = require('../schemes/chatMessage')
const ProjectTaskSchema = require('../schemes/projectTask')
const Schema = mongoose.Schema;

//Create Schema and Model
const ProjectSchema = new Schema({
    title: {type: String, required: true},
    members: [ProjectMemberSchema],
    chat: [ChatMessageSchema],
    tasks: [ProjectTaskSchema]
});

//Export the model so we can use it in other files
const Project = mongoose.model('project', ProjectSchema);
module.exports = Project;