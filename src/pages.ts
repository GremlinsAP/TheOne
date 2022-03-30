import fs from "fs";
import { Express } from "express-serve-static-core";
import { Quiz, IQuizData } from "./quiz";
import { Request, Response } from "express";
import { Util } from "./utils";

export class Pages {

    private static readonly views: string[] = fs.readdirSync("./views/").map(s => s.replace(".ejs", ""));


    public static registerViewLinks(app: Express): void {

        // Index
        app.get("/", async (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            res.render("index", { title: "Index" });
        });

        // Quiz get
        app.get("/quiz", async (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            res.render("quiz", { title: "Quiz" });
        });

        // Quiz post 
        app.post("/quiz-data", async (req: Request, res: Response) => {
            await Quiz.handleQuizPost(req, res);
            res.sendStatus(200);
        });

        app.get("/quiz-data", async (req: Request, res: Response) => {
            res.status(200);
            const data: IQuizData = Quiz.CompileQuizData(req, res);
            res.json(data);
        });

        // Favorites 
        app.get("/favorites", (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            res.render("favorites", { title: "Favorites" });
        });

        // Blacklist
        app.get("/blacklist", (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);

            res.render("blacklist", { title: "Blacklist", blacklistedQuotes: Util.INSTANCE.getBlacklistedQuestions });
        });

        // Not found, send 404 page
        app.use((req: Request, res: Response) => {
            res.status(404);
            res.render('404');
        });
        
        //landing
        app.get("/landing", (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            res.render("landing", { title: "Landing" });
        });
    }
}

export interface PageData {
    title?: string,
}