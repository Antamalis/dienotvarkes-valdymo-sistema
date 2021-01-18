const express = require('express');
const session = require('express-session')
const passport = require("passport")
const flash = require('express-flash')
const mongoose = require('mongoose');
const config = require('./config/database');
const path = require('path');

const ensureAuthenticated = require('./config/ensureAuthenticated')
const initializePassport = require("./config/passport")
initializePassport(passport)

//Init app
const app = express();
app.use(express.urlencoded({extended: false}))

//Start server
const server = app.listen(1800, () => {
    console.log("Server started on port 1800...");    
});

//Load View engine
app.set('view engine', 'ejs');

//Set public folder
app.use(express.static(path.join(__dirname, 'public')));

app.use(flash())
app.use(session({
    secret: 'labai paslaptinga',
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

//Connect to the DB
mongoose.connect(config.database, { useNewUrlParser: true });
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

app.use('/register', require('./routes/register'));
app.use('/login', require('./routes/login'));
app.use('/logout', require('./routes/logout'));