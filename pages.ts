import { app } from "./index";

// Index page
app.get('/', (req: any, res: any) => {
    res.type("text/html");
    res.render("index");
});

// 404 page
app.use((req: any, res: any) => {
    res.type("text/html");
    res.status(404);
    res.send("The pre")
});