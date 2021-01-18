const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/database');

//Init app
const app = express();

//Start server
const server = app.listen(1800, () => {
    console.log("Server started on port 1800...");    
});

//Load View engine
//app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Connect to the DB
mongoose.connect(config.database, { useNewUrlParser: true });
const db = mongoose.connection;

//Index route
app.get('/', (req, res) => {
    res.render('index');
});