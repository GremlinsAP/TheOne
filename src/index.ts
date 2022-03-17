const express = require("express");
const ejs = require('ejs');
const dotenv = require('dotenv').config();

// Export
export const app = express();

// Set the view engine to ejs (easy template)
app.set('view engine', 'ejs');

// Let the app know about our public folder
app.use(express.static(__dirname + '/public'))

// Setting the listening port
const port = process.env.PORT || 3000;
app.set('port', port);

// Let the app listen on the main port and load pages
app.listen(port, () => {
    load();
    console.log(`[Server] The app has started listening on port: ${port}`);
});

// Load extra things that need to happen when app finishes launching
const load = () => require("./pages");