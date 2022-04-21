// Node.js program to demonstrate the
// fs.appendFileSync() method

// Import the filesystem module
const fs = require('fs');

// Get the file contents before the append operation
console.log("\nFile Contents of file before append:",
fs.readFileSync("favorite.txt", "utf8"));

fs.appendFileSync("favorite.txt", );

// Get the file contents after the append operation
console.log("\nFile Contents of file after append:",
	fs.readFileSync("favorite.txt", "utf8"));
