const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../config/ensureAuthenticated')
const User = require('../models/user.js');
const Task = require('../schemes/task');
const logger = require("../logger.js");
const Project = require('../models/project');

router.get('/fetchCalendar', ensureAuthenticated, async (req, res) => {
    try {
        const calendar = await getCalendar(req.user.id);
        const data = {tasks: calendar.tasks};
        res.json(data);
        logger.debug(`Fetched calendar for user ${req.user.id}:\n${calendar}`);
    } catch (error) {
        res.status(500).json("An error has occured while handling the request. Please try again later!")
        logger.error(`Failed to fetch user ${req.user.id} calendar:\n${error}`);
    }
});

router.get('/fetchProjects', ensureAuthenticated, async (req, res) => {
    try {
        const user = await getUserByIdLean(req.user._id)
        res.json(user.projects);
        logger.debug(`Fetched projects for user ${req.user.id}:\n${user.projects}`);
    } catch (error) {
        res.status(500).json("An error has occured while handling the request. Please try again later!")
        logger.error(`Failed to fetch projects for user ${req.user.id}:\n${error}`);
    }
});

router.post('/fetchProjectData', ensureAuthenticated, async (req, res) => {
    try {
        const projectId = req.body.projectId;
        const fetchedProject = await findProjectByIdLean(projectId);

        if(fetchedProject && fetchedProject.members.some((member) => member.userId == req.user._id)){
            res.json({projectData: fetchedProject})
            logger.debug(`Fetched project ${projectId} for user ${req.user.id}`);
            console.log(`Fetched project ${projectId} for user ${req.user.id}`);
        }
    } catch (error) {
        res.status(500).json("An error has occured while handling the request. Please try again later!")

        logger.error(`Failed to fetch project ${req.body.projectId} data for user ${req.user.id}:\n${error}`);
    }
});

router.post('/fetchProjectTaskData', ensureAuthenticated, async (req, res) => {
    try {
        const {projectId, taskId} = req.body
        const fetchedProject = await findProjectByIdLean(projectId);
        const projectCreator = await findProjectCreatorId(projectId);
        const taskData = fetchedProject.tasks.find(task => task._id == taskId);
        const projectMember = fetchedProject.members.some((member) => member.userId == req.user._id);

        if(fetchedProject && taskData && projectMember){
            let canEdit = false;

            if(projectCreator == req.user._id || taskData.assingedTo == req.user.username) canEdit = true;

            res.json({taskData, canEdit})
            logger.debug(`Fetched project task ${taskId} data of project ${projectId} for user ${req.user.id}`);
            console.log(`Fetched project task ${taskId} data of project ${projectId} for user ${req.user.id}`);
        }
    } catch (error) {
        console.log(error)
        res.status(500).json("An error has occured while handling the request. Please try again later!")

        logger.error(`Failed to fetch project ${req.body.projectId} data for user ${req.user.id}:\n${error}`);
        console.log("ZSSSSSSS");
    }
});

router.post('/updateProjectTaskData', ensureAuthenticated, async (req, res) => {
    try {
        const { taskName, taskComment, taskAssignee, taskStatus, taskId, projectId, taskDueDate } = req.body
        const fetchedProject = await findProjectById(projectId);
        const projectMember = fetchedProject.members.find((member) => member.userId == req.user._id);
        const projectTaskIndex = fetchedProject.tasks.findIndex((task) => task._id == taskId);

        if(fetchedProject && projectMember && projectTaskIndex != -1 && (fetchedProject.tasks[projectTaskIndex].assingedTo == req.user.username || projectMember.isCreator)){
            fetchedProject.tasks[projectTaskIndex].name = taskName;
            fetchedProject.tasks[projectTaskIndex].comments = taskComment;

            if(taskAssignee == "none"){
                fetchedProject.tasks[projectTaskIndex].assingedTo = "";
            }else{
                fetchedProject.tasks[projectTaskIndex].assingedTo = taskAssignee;
            }

            console.log(taskDueDate);
            fetchedProject.tasks[projectTaskIndex].dueDate = taskDueDate;
            fetchedProject.tasks[projectTaskIndex].completed = taskStatus;
            
            await fetchedProject.save();
        }

        res.json({tasks: fetchedProject.tasks})
    } catch (error) {
        console.log(error)
        res.status(500).json("An error has occured while handling the request. Please try again later!")

        logger.error(`Failed to fetch project ${req.body.projectId} data for user ${req.user.id}:\n${error}`);
    }
});

router.post('/deleteProject', ensureAuthenticated, async (req, res) => {
    try {
        const projectId = req.body.projectId;

        const fetchedProject = await findProjectByIdLean(projectId);
        const creatorId = await findProjectCreatorId(projectId)

        if(fetchedProject && creatorId == req.user._id){
            await Project.deleteOne({ _id: projectId })

            for (let i = 0; i < fetchedProject.members.length; i++) {
                const member = fetchedProject.members[i];
                
                await User.findOneAndUpdate({_id: member.userId}, {$pull: {"projects": {projectId}}}).lean()
            }

            res.json({success: true})
            logger.debug(`Deleted project ${projectId} as requested by user ${req.user.id}`);
            console.log(`Deleted project ${projectId} as requested by user ${req.user.id}`);
        }else{
            res.json({success: false})
        }
    } catch (error) {
        console.log(error)
        res.status(500).json("An error has occured while handling the request. Please try again later!")

        logger.error(`Failed to delete project ${req.body.projectId}:\n${error}`);
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
        res.status(500).json("An error has occured while handling the request. Please try again later!")

        logger.error(`Failed to add new task "${req.body.taskName}" for user ${req.user.id}:\n${error}`);
    }
});

router.post('/addProjectTask', ensureAuthenticated, async (req, res) => {
    try {
        const {projectId} = req.body
        const taskName = req.body.taskName.trim();
        const creatorId = await findProjectCreatorId(projectId);

        console.log(projectId);
        console.log(taskName);
        console.log(creatorId);

        if (taskName && creatorId == req.user._id) {
            let newTasks = await addProjectTask(projectId, taskName)
            res.json({tasks: newTasks})

            logger.debug(`Added new task "${taskName}" to project ${projectId}`);
        }

    } catch (error) {
        console.log(error)
        res.status(500).json("An error has occured while handling the request. Please try again later!")

        logger.error(`Failed to add new task "${req.body.taskName}" to project ${req.body.projectId}:\n${error}`);
    }
});

router.post('/editTask', ensureAuthenticated, async (req, res) => {
    try {
        const taskId = req.body.taskId.trim();
        const taskName = req.body.taskName.trim();
        const taskComment = req.body.taskComment.trim();

        if (taskId && taskName) {
            let newTasks = await editTask(req.user.id, taskId, taskName, taskComment)
            res.json({tasks: newTasks})
        }

        logger.debug(`Edited task ${taskId} for user ${req.user.id}:\nName: ${taskName}\nComment: ${taskComment}`);
    } catch (error) {
        console.log(error)
        res.status(500).json("An error has occured while handling the request. Please try again later!")
        logger.error(`Failed editing task ${req.body.taskId} for user ${req.user.id}:\nName: ${req.body.taskName}\nComment: ${req.body.taskComment}`);
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
        res.status(500).json("An error has occured while handling the request. Please try again later!")

        logger.error(`Failed updating task ${req.body.taskId} for user ${req.user.id}:\nCompleted: ${req.body.completed}`);
    }
});

router.post('/updateProjectTaskStatus', ensureAuthenticated, async (req, res) => {
    try {
        const {taskId, completed, projectId} = req.body;

        console.log(taskId);
        console.log(completed);
        console.log(projectId);

        if (taskId && projectId) {
            const project = await findProjectById(projectId);

            project.tasks.id(taskId).completed = completed;
            await project.save();

            res.json({taskId: taskId, completed: completed})
        }

        logger.debug(`Updated task ${taskId} for user ${req.user.id}:\nCompleted: ${completed}`);
    } catch (error) {
        console.log(error)
        res.status(500).json("An error has occured while handling the request. Please try again later!")

        logger.error(`Failed updating task ${req.body.taskId} for user ${req.user.id}:\nCompleted: ${req.body.completed}`);
    }
});

router.post('/deleteTask', ensureAuthenticated, async (req, res) => {
    try {
        const {taskId} = req.body;

        console.log(taskId);

        if (taskId) {
            let newTasks = await deleteTask(req.user.id, taskId)

            logger.debug(`Deleted task ${taskId} for user ${req.user.id}`);

            res.json({tasks: newTasks})
        }
    } catch (error) {
        console.log(error)
        res.status(500).json("An error has occured while handling the request. Please try again later!")

        logger.error(`Failed deleting task ${req.body.taskId} for user ${req.user.id}`);
    }
});

router.post('/changeDueDate', ensureAuthenticated, async (req, res) => {
    try {
        const {taskId, date} = req.body;

        if (taskId) {
            let newTasks = await changeTaskDueDate(req.user.id, taskId, date)

            logger.debug(`Changed due date of task ${taskId} for user ${req.user.id}`);

            res.json({tasks: newTasks})
        }
    } catch (error) {
        console.log(error)
        res.status(500).json("An error has occured while handling the request. Please try again later!")

        logger.error(`Failed changing due date of task ${req.body.taskId} for user ${req.user.id}`);
    }
});

router.post('/createNewProject', ensureAuthenticated, async (req, res) => {
    try {
        const {title} = req.body;

        console.log(`NAME: ${title}`);

        if (title) {
            let newProjectList = await createNewProject(req.user.id, req.user.username, title)

            logger.debug(`Created new project ${title} for user ${req.user.id}`);

            res.json({projects: newProjectList})
        }
    } catch (error) {
        console.log(error)
        res.status(500).json("An error has occured while handling the request. Please try again later!")

        logger.error(`Failed creating new project ${req.body.title} for user ${req.user.id}`);
    }
});

router.post('/addMembersToProject', ensureAuthenticated, async (req, res) => {
    try {
        const {memberList, projectId} = req.body;        
        const creatorId = await findProjectCreatorId(projectId)
        

        if (memberList.length > 0 && projectId && creatorId == req.user._id) {
            await addMembersToProject(projectId, memberList)

            logger.debug(`Added new member(s) ${memberList} to project ${projectId}`);

            res.json(memberList)
        }
    } catch (error) {
        console.log(error)
        if(error == "Toks vartotojas neegzistuoja!" || error == "Šis vartotojas jau yra pridėtas prie šio projekto"){
            res.status(500).json({error})
        }else{
            res.status(500).json({error: "Įvyko nežinoma klaida, prašom pabandyti vėliau!"})
        }

        logger.error(`Failed adding new member to project ${req.body.projectId} for user ${req.user.id}`);
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

async function addProjectTask(projectId, taskName) {
    try {
        const newTask = {
            name: taskName
        }
        const updatedProject = await Project.findOneAndUpdate({_id: projectId}, {$push: {tasks: newTask}}, {new: true});

        return updatedProject.tasks
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

async function deleteTask(userId, taskId) {
    try {
        console.log(`DELETING ${taskId}`);

        let result = await User.findOneAndUpdate({
                _id: userId
            }, 
            { $pull: {
                    "calendar.tasks": {
                        _id: taskId
                    }
                }
            }, 
            {
                new: true
            }
        ).lean();

        return result.calendar.tasks
    } catch (error) {
        logger.error(error)
    }
}

async function changeTaskDueDate(userId, taskId, date) {
    try {
        console.log(`CHAGING DUE DATE ${taskId}`);

        let result = await User.findOneAndUpdate({_id: userId, "calendar.tasks._id": taskId}, {$set: {"calendar.tasks.$.dueDate": date}}, {new: true}).lean();

        return result.calendar.tasks
    } catch (error) {
        logger.error(error)
    }
}

async function createNewProject(userId, member, title) {
    try {
        console.log(`CREATING NEW PROJECT ${title}`);

        const newProject = new Project({
            title: title,
            members: [{
                userId,
                name: member,
                isCreator: true
            }]
        })

        const savedProject = await newProject.save();

        console.log("SAVED");

        const user = await User.findOneAndUpdate({_id: userId}, {$push: {projects: {projectId: savedProject._id, projectTitle: savedProject.title}}}, {new: true}).lean();

        return user.projects
    } catch (error) {
        logger.error(error)
        console.log(error);
    }
}

async function addMembersToProject(projectId, memberList) {
    try {
        console.log(`Adding members to project ${memberList}`);
        let existingProject = await findProjectById(projectId);

        if(existingProject){
            for (let i = 0; i < memberList.length; i++) {
                const member = memberList[i];
                const existingUser = await findUserByUsernameLean(member);

                if(!existingUser) throw 'Toks vartotojas neegzistuoja!';

                if(existingProject.members.find(m => m.name == member)) throw 'Šis vartotojas jau yra pridėtas prie šio projekto';
                
                if(existingUser && !existingProject.members.find(m => m.name == member)){
                    const newMember = {
                        userId: existingUser._id,
                        name: existingUser.username,
                        isCreator: false
                    }
    
                    const newProjectEntry = {
                        projectId,
                        projectTitle: existingProject.title
                    }
    
                    existingProject.members.push(newMember)
                    await User.findOneAndUpdate({_id: existingUser._id}, {$push: {projects: newProjectEntry}})
                }
            }
    
            await existingProject.save();

            return existingProject.members
        }        
    } catch (error) {
        throw error
    }
}

async function getUserById(userId) {
    try {
        return await User.findById(userId);
    } catch (error) {
        logger.error(error)
    }
}

async function findProjectById(projectId) {
    try {
        return await Project.findById(projectId);
    } catch (error) {
        logger.error(error)
    }
}

async function findProjectByIdLean(projectId) {
    try {
        return await Project.findById(projectId).lean();
    } catch (error) {
        logger.error(error)
    }
}

async function findUserByUsernameLean(username) {
    try {
        return await User.findOne({username}).lean();
    } catch (error) {
        logger.error(error)
    }
}

async function getUserByIdLean(userId) {
    try {
        return await User.findById(userId).lean();
    } catch (error) {
        logger.error(error)
    }
}

async function findProjectCreatorId(projectId) {
    const project = await findProjectByIdLean(projectId);

    if(project){
        return project.members.find(member => member.isCreator).userId;
    }else{
        return false
    }
}

module.exports = router;