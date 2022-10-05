const express = require('express');
const session = require('express-session')
const passport = require("passport")
const flash = require('express-flash')
const mongoose = require('mongoose');
const config = require('./config/database');
const path = require('path');
const socket = require('socket.io');
const ensureAuthenticated = require('./config/ensureAuthenticated')
const initializePassport = require("./config/passport");
const Project = require('./models/project');
const sessionMiddleware = session({
    secret: 'labai paslaptinga',
    resave: false,
    saveUninitialized: false
})

initializePassport(passport)

//Init app
const app = express();
app.use(express.urlencoded({extended: false}))
app.use(express.json())

//Start server
const server = app.listen(1888, () => {
    console.log("Server started on port 1888...");    
});

const io = socket(server);
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

io.on("connection", async (socket) => {
    const projectId = socket.request.headers.referer.split('/').slice(-1)[0];

    if(socket.request.user){
        socket.join(projectId)
        console.log(socket.rooms);
    }

    socket.on('sendMessage', async (data) => {
        if(data.message && socket.request.user){
            const newChatMessage = {
                senderId: socket.request.user._id,
                senderName: socket.request.user.username,
                content: data.message
            }

            const updatedProject = await Project.findOneAndUpdate({_id: projectId}, {$push: {chat: newChatMessage}}, {new: true}).lean();

            io.to(projectId).emit("chatUpdate", updatedProject.chat)
        }
    });

    const projectData = await Project.findById(projectId).lean()
    io.to(projectId).emit("chatUpdate", projectData.chat)
});

//Load View engine
app.set('view engine', 'ejs');

//Set public folder
app.use(express.static(path.join(__dirname, 'public')));

//Set up session
app.use(flash())
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())

//Connect to the DB
mongoose.connect(config.database, { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.once('open', () =>{
    console.log('Connected to MongoDB');
}).on('error', (error) => {
    console.log('Connection error:',error);
});

//Index route
app.get('/', ensureAuthenticated, (req, res) => {
    res.render('index', {user: req.user});
});

app.get('/landing', (req, res) => {
    res.render('landing', {user: req.user});
});


//Other routes
app.use('/register', require('./routes/register'));
app.use('/login', require('./routes/login'));
app.use('/logout', require('./routes/logout'));
app.use('/api', require('./routes/api'));
app.use('/project/', require('./routes/project'));