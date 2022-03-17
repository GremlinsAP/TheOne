import { app } from "./index";
import fs from "fs";

const pages: string[] = fs.readdirSync("./views/").map(s => s.replace(".ejs",""));

interface Request {
    url: string;
}

// Page rendering
app.use((req: Request, res: any) => {
    res.type("text/html");
    let fileName = req.url == "/" ? "index" : req.url.replace("/", "");

    // Does it contain our filename?
    if (pages.includes(fileName)) {
        res.render(fileName);
        return;
    }

    // Not found, send 404 page
    res.status(404);
    res.render('404');
});