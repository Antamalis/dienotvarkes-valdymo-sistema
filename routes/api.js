const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../config/ensureAuthenticated')
const User = require('../models/user.js');
const Task = require('../schemas/task');

router.get('/fetchCalendar', ensureAuthenticated, async (req, res) => {
    try {
        const calendar = await getCalendar(req.user.id)
        const data = {tasks: calendar.tasks}
        res.json(data)
    } catch (error) {
        res.json({
            status: res.statusCode,
            statusMessage: res.statusMessage
        })
    }
});

router.post('/addTask', ensureAuthenticated, async (req, res) => {
    try {
        const taskName = req.body.taskName.trim();
        if (taskName) {
            let newTasks = await addTask(req.user.id, taskName)
            res.json({tasks: newTasks})
        }
    } catch (error) {
        console.log(error)
        res.json({
            status: res.statusCode,
            statusMessage: res.statusMessage
        })
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
    } catch (error) {
        console.log(error)
        res.json({
            status: res.statusCode,
            statusMessage: res.statusMessage
        })
    }
});

async function getCalendar(userId) {
    const user = await User.findById(userId).exec();

    return user.calendar;
}

async function addTask(userId, taskName) {
    const user = await getUserById(userId);
    const newTask = {
        name: taskName
    }

    user.calendar.tasks.push(newTask);
    user.calendar.totalTasks = user.calendar.totalTasks + 1;

    await user.save();

    return user.calendar.tasks
}

async function getUserById(userId) {
    return await User.findById(userId).exec();
}

module.exports = router;