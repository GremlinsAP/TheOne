import { app } from "./index";

// Index page
app.get('/', (req: any, res: any) => {
    res.type("text/html");
    res.render("index");
});

// Quiz page
app.get('/quiz', (req: any, res: any) => {
    res.type("text/html");
    res.render("quiz");
});

// Blacklist page
app.get('/blacklist', (req: any, res: any) => {
    res.type("text/html");
    res.render("blacklist");
});

// Favorites page
app.get('/blacklist', (req: any, res: any) => {
    res.type("text/html");
    res.render("favorites");
});

// 404 page
app.use((req: any, res: any) => {
    res.type("text/html");
    res.status(404);
    res.send("[404] - Page not found!")
});