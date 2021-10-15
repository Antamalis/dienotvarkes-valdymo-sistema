const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../config/ensureAuthenticated')
const User = require('../models/user.js');
const Task = require('../schemes/task');
const logger = require("../logger.js");

router.get('/fetchCalendar', ensureAuthenticated, async (req, res) => {
    try {
        const calendar = await getCalendar(req.user.id);
        const data = {tasks: calendar.tasks};
        res.json(data);
        logger.debug(`Fetched calendar for user ${req.user.id}:\n${calendar}`);
    } catch (error) {
        res.json({
            status: res.statusCode,
            statusMessage: res.statusMessage
        })
        logger.error(`Failed to fetch user ${req.user.id} calendar:\n${error}`);
    }
});

router.post('/addTask', ensureAuthenticated, async (req, res) => {
    try {
        const taskName = req.body.taskName.trim();
        if (taskName) {
            let newTasks = await addTask(req.user.id, taskName)
            res.json({tasks: newTasks})
        }

        logger.debug(`Added new task "${taskName}" for user ${req.user.id}`);
    } catch (error) {
        console.log(error)
        res.json({
            status: res.statusCode,
            statusMessage: res.statusMessage
        })

        logger.error(`Failed to add new task "${taskName}" for user ${req.user.id}:\n${error}`);
    }
});

router.post('/editTask', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = req.body.taskId.trim();
        const taskName = req.body.taskName.trim();
        const taskComment = req.body.taskComment.trim();

        console.log(taskId);
        console.log(taskName);
        console.log(taskComment);

        if (taskId && taskName) {
            let newTasks = await editTask(req.user.id, taskId, taskName, taskComment)
            res.json({tasks: newTasks})
        }

        logger.debug(`Edited task ${taskId} for user ${req.user.id}:\nName: ${taskName}\nComment: ${taskComment}`);
    } catch (error) {
        console.log(error)
        res.json({
            status: res.statusCode,
            statusMessage: res.statusMessage
        })
        logger.error(`Failed editing task ${taskId} for user ${req.user.id}:\nName: ${taskName}\nComment: ${taskComment}`);
    }
});

router.post('/updateTaskStatus', ensureAuthenticated, async (req, res) => {
    try {
        const {taskId, completed} = req.body;
        if (taskId) {
            const user = await getUserById(req.user.id);

            user.calendar.tasks.id(taskId).completed = completed;
            await user.save();

            res.json({taskId: taskId, completed: completed})
        }

        logger.debug(`Updated task ${taskId} for user ${req.user.id}:\nCompleted: ${completed}`);
    } catch (error) {
        console.log(error)
        res.json({
            status: res.statusCode,
            statusMessage: res.statusMessage
        })

        logger.error(`Failed updating task ${taskId} for user ${req.user.id}:\nCompleted: ${completed}`);
    }
});

async function getCalendar(userId) {
    try {
        const user = await User.findById(userId).exec();

        return user.calendar;
    } catch (error) {
        logger.error(error);
    }
}

async function addTask(userId, taskName) {
    try {
        const user = await getUserById(userId);
        const newTask = {
            name: taskName
        }

        user.calendar.tasks.push(newTask);
        user.calendar.totalTasks = user.calendar.totalTasks + 1;

        await user.save();

        return user.calendar.tasks
    } catch (error) {
        logger.error(error)
    }
    
}

async function editTask(userId, taskId, taskName, taskComment) {
    try {
        const user = await getUserById(userId);
        user.calendar.tasks.forEach(task => {
            if (task._id == taskId) {
                task.name = taskName;
                task.comments = taskComment;
            }
        });

        await user.save();

        return user.calendar.tasks
    } catch (error) {
        logger.error(error)
    }
}

async function getUserById(userId) {
    try {
        return await User.findById(userId).exec();
    } catch (error) {
        logger.error(error)
    }
}

module.exports = router;