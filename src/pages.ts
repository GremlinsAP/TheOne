import { Express } from "express-serve-static-core";
import { Quiz, IQuizData } from "./quiz";
import { Request, Response } from "express";
import { Util } from "./utils";
import { QuoteRate } from "./quoterate";
import { IQuote } from "./api";

export class Pages {

    public static registerViewLinks(app: Express): void {

        //landing
        app.get("/", (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            res.sendFile(__dirname + "/public/pages/landing.html");
        });

        // Index
        app.get("/index", async (req: Request, res: Response) => {
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
            const data: IQuizData = await Quiz.CompileQuizData(req, res);
            res.json(data);
        });

        // Favorites 
        app.get("/favorites", async (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            let favorites: IQuote[] = await Util.INSTANCE.getFavouritedQuotes(req.session);
            res.render("favorites", { title: "Favorites", favoritedQuotes: favorites });
        });

        // Blacklist
        app.get("/blacklist", async (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            let blacklisted: IQuote[] = await Util.INSTANCE.getBlacklistedQuotes(req.session);

            res.render("blacklist", { title: "Blacklist", blacklistedQuotes: blacklisted });
        });

        app.post("/rate-quote", (req: Request, res: Response) => {
            if (req.body && req.body.type) {
                let action = req.body.action;
                let quoteId = req.body.quoteId;
                let reason = req.body.reason;
                let session = req.session;

                switch (req.body.type) {
                    case "favorite":
                        switch (action) {
                            case "add": QuoteRate.addFavorite(session, quoteId, reason); break;
                            case "edit": QuoteRate.editFavorite(session, quoteId, reason); break;
                            case "remove": QuoteRate.removeFavorite(session, quoteId); break;
                        }
                        break;
                    case "blacklist":
                        switch (action) {
                            case "add": QuoteRate.addBlacklisted(session, quoteId, reason); break;
                            case "edit": QuoteRate.editBlacklisted(session, quoteId, reason); break;
                            case "remove": QuoteRate.removeBlacklisted(session, quoteId); break;
                        }
                        break;
                }
            }
        });

        // Not found, send 404 page
        app.use((req: Request, res: Response) => {
            res.status(404);
            res.render('404');
        });


    }
}

export interface PageData {
    title?: string,
}