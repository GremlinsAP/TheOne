import fs from "fs";
import { Express } from "express-serve-static-core";
import { Util } from "./utils";
import { Quiz } from "./quiz";


export class Pages {

    private static readonly views: string[] = fs.readdirSync("./views/").map(s => s.replace(".ejs", ""));


    public static registerViewLinks(app: Express): void {

        // Index
        app.get("/", (req, res) => {
            res.type("text/html");
            res.status(200);
            res.render("index", { title: "Index" });
        });

        app.get("/quiz", (req, res) => {
            res.type("text/html");
            res.status(200);
            Quiz.get("", req, res);
        });

        app.post("/quiz", (req, res) => {
            res.type("text/html");
            res.status(200);
            Quiz.post("", req, res);
        });

        app.get("/favorites", (req, res) => {
            res.type("text/html");
            res.status(200);
            res.render("favorites", { title: "Favorites" });
        });

        app.get("/blacklist", (req, res) => {
            res.type("text/html");
            res.status(200);
            res.render("blacklist", { title: "Blacklist" });
        });

        // Not found, send 404 page
        app.use((req, res) => {
            res.status(404);
            res.render('404');
        });
    }
}

export interface PageData {
    title?: string,

}