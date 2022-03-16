const express = require("express");
const ejs = require('ejs');

// Export
export const app = express();

// Set the view engine to ejs (easy template)
app.set('view engine', 'ejs');

// Let the app know about our public folder
app.use(express.static(__dirname + '/public'))

// Setting the listening port
app.set('port', process.env.PORT || 3000);

// Let the app listen on the main port
app.listen(app.get('port'), () => {
    load();
    console.log("[Server] The app has started listening on port:" + app.get('port'));
});

const load = () => {
    require("./pages");
}
