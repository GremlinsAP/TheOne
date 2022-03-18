import fs from "fs";
import { Request, Response } from "express";

export class Pages {

    public static readonly views: string[] = fs.readdirSync("./views/").map(s => s.replace(".ejs", ""));

    public static SetupViews(app: any): void {

        // Page rendering
        app.use((req: Request, res: Response) => {
            res.type("text/html");
            let fileName = req.url == "/" ? "index" : req.url.replace("/", "");
            
            // Does it contain our filename?
            if (Pages.views.includes(fileName)) {
                res.render(fileName);
                return;
            }

            // Not found, send 404 page
            res.status(404);
            res.render('404');
        });
    }
}
