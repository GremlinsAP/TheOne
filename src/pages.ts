import fs from "fs";
import { Express } from "express-serve-static-core";
import { Quiz, QuizData } from "./quiz";

export class Pages {

    private static readonly views: string[] = fs.readdirSync("./views/").map(s => s.replace(".ejs", ""));


    public static registerViewLinks(app: Express): void {

        // Index
        app.get("/", async (req, res) => {
            res.type("text/html");
            res.status(200);
            res.render("index", { title: "Index" });
        });

        // Quiz get
        app.get("/quiz", async (req, res) => {
            res.type("text/html");
            res.status(200);
            const data: QuizData = await Quiz.process(req, res);
            res.render(`quiz-${data.quizState}`, data);
        });

        // Quiz post 
        app.post("/quiz", async (req, res) => {
            await Quiz.process(req, res);
            res.redirect("/quiz");
        });

        // Favorites
        app.get("/favorites", (req, res) => {
            res.type("text/html");
            res.status(200);
            res.render("favorites", { title: "Favorites" });
        });

        // Blacklist
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