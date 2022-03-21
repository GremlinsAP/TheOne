import fs from "fs";
import { Request, Response } from "express";
import { Express } from "express-serve-static-core";

export class Pages {

    private static readonly views: string[] = fs.readdirSync("./views/").map(s => s.replace(".ejs", ""));
    private static readonly viewData: Map<string, PageCallback> = new Map<string, PageCallback>();

    public static setup(app: Express): void {
        this.views.forEach(view => {
            this.viewData.set(view, (req, res) => {
                return {};
            });
        });

        this.registerViewLinks(app);
    }

    public static registerPageCallback(name: string, callback: PageCallback): void {
        this.viewData.set(name, callback);
    }

    private static registerViewLinks(app: Express): void {

        // Page rendering
        app.use((req: Request, res: Response) => {
            res.status(200);
            res.type("text/html");
            let fileName = req.url == "/" ? "index" : req.url.replace("/", "");

            // Does it contain our filename?
            if (Pages.views.includes(fileName)) {
                res.status(200);
                res.render(fileName, this.viewData.get(fileName)!(req, res));
                return;
            }

            // Not found, send 404 page
            res.status(404);
            res.render('404');
        });
    }
}

export interface PageCallback {
    (req: Request, res: Response): object;
}