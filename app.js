const express = require('express');
const session = require('express-session')
const mongoose = require('mongoose');
const config = require('./config/database');
const path = require('path');

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

//Connect to the DB
mongoose.connect(config.database, { useNewUrlParser: true });
const db = mongoose.connection;

db.once('open', () =>{
    console.log('Connected to MongoDB');
}).on('error', (error) => {
    console.log('Connection error:',error);
});


//Index route
app.get('/', (req, res) => {
    res.render('index');
});

app.use('/register', require('./routes/register'));