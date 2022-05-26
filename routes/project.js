const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../config/ensureAuthenticated')
const User = require('../models/user.js');
const logger = require("../logger.js");
const Project = require('../models/project.js');

router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const project = await getProject(req.params.id);
        const creatorId = project.members.find(member => member.isCreator).userId;

        if(project.members.some( (member) => member.userId == req.user._id)){
            //User sending request exists in the member array of project
            res.render('project', {title: project.title, user: req.user, id: project._id, creatorId});
        }

        console.log("BBBBBBBBBBBBBBBBB");

        logger.debug(`Fetched project ${project._id}:\n${project}`);
    } catch (error) {
        res.json({
            status: res.statusCode,
            statusMessage: res.statusMessage
        })
        logger.error(`Failed to fetch user ${req.user.id} calendar:\n${error}`);
    }
});

router.get('/:id/stats', ensureAuthenticated, async (req, res) => {
    try {
        const project = await getProject(req.params.id);

        if(project.members.some( (member) => member.userId == req.user._id)){
            //User sending request exists in the member array of project
            res.render('projectStats', {title: project.title, user: req.user, id: project._id});
            console.log("?????");
        }

        console.log("AAAAAAAAAAAAAAAAAA");

        logger.debug(`Fetched project stats for project ${project._id}:\n${project}`);
    } catch (error) {
        res.json({
            status: res.statusCode,
            statusMessage: res.statusMessage
        })
        logger.error(`Failed to fetch project stats for project ${req.params.id}:\n${error}`);
    }
});

async function getProject(projectId) {
    try {
        const project = await Project.findById(projectId).lean();

        return project;
    } catch (error) {
        logger.error(error);
    }
}

module.exports = router;