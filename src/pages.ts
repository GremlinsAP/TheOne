import { app } from "./index";
const fs = require("fs");

const pages: string[] = fs.readdirSync("./views/");

interface Request {
    url: string;
}

// Page rendering
app.use((req: Request, res: any) => {
    res.type("text/html");
    let fileName = req.url == "/" ? "index" : req.url.replace("/", "");

    if (pages.includes(`${fileName}.ejs`)) {
        res.render(fileName);
        return;
    }

    // Not found, send 404 page
    res.status(404);
    res.render('404');
});