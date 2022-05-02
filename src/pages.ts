import { Express } from "express-serve-static-core";
import { Quiz, IQuizData, QuizType } from "./quiz";
import { Request, Response } from "express";
import { CharacterPath, Util } from "./utils";
import { IQuoteRate, QuoteRate } from "./quoterate";
import { ICharacter, IQuote } from "./api";
import { Database } from "./database";
import { ObjectId } from "mongodb";
import { SessionManager } from "./sessionmanager";
import { AccountManager } from "./accountmanager";
import { IScoreBoardEntry, Scoreboard } from "./scoreboard";

export class Pages {
  public static registerViewLinks(app: Express): void {

    //landing
    app.get("/", async (req: Request, res: Response) => {
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
      let ratesFavorites: IQuoteRate[] = await Util.INSTANCE.getFavouritedQuotesRates(req.session);
      let favorites: IQuote[] = await Util.INSTANCE.getFavouritedQuotes(req.session);
      let characters: ICharacter[] = ((await Util.INSTANCE.GetData(CharacterPath)) as ICharacter[]).filter((char) => favorites.map((c) => c.character).includes(char._id));

      res.render("favorites", {
        title: "Favorites",
        favoritedQuotes: favorites,
        rates: ratesFavorites,
        characters: characters,
      });
    });

    // Blacklist
    app.get("/blacklist", async (req: Request, res: Response) => {
      res.type("text/html");
      res.status(200);

      let ratesBlacklist: IQuoteRate[] = await Util.INSTANCE.getBlacklistedQuotesRates(req.session);
      let blacklisted: IQuote[] = await Util.INSTANCE.getBlacklistedQuotes(req.session);

      res.render("blacklist", {
        title: "Blacklist",
        blacklistedQuotes: blacklisted,
        rates: ratesBlacklist
      });
    });

    // Rating
    app.post("/rate-quote", (req: Request, res: Response) => {
      if (req.body && req.body.type) {
        let action = req.body.action;
        let quoteId = req.body.quoteId;
        let reason = req.body.reason;
        let session = req.session;

        switch (req.body.type) {
          case "favorite":
            switch (action) {
              case "add": QuoteRate.addFavorite(session, quoteId); break;
              case "remove": QuoteRate.removeFavorite(session, quoteId); break;
            } break;
          case "blacklist":
            switch (action) {
              case "add": QuoteRate.addBlacklisted(session, quoteId, reason); break;
              case "edit": QuoteRate.editBlacklisted(session, quoteId, reason); break;
              case "remove": QuoteRate.removeBlacklisted(session, quoteId); break;
            } break;
        }

        SessionManager.MigrateSessionDataToAccount(session);
        res.sendStatus(200);
      }
    });

    // Get rate
    app.get("/rate/:quoteId", (req: Request, res: Response) => {
      let quoteId = req.params.quoteId;
      res.status(200).json({
        favorite: QuoteRate.isFavorite(req.session, quoteId),
        blacklisted: QuoteRate.isBlacklisted(req.session, quoteId)
      });
    });

    // Scoreboard
    app.get("/scoreboard/:type", async (req: Request, res: Response) => {
      res.json(Scoreboard.sort(await Scoreboard.getEntries(req.params.type as QuizType)));
    });

    // Register
    app.get("/register", async (req: Request, res: Response) => {
      res.render("register", { title: "Register" });
    });


    // Register
    app.post("/register", async (req: Request, res: Response) => {
      if (req.body.username && req.body.password && req.body.passwordconfirm)
        if (await AccountManager.createAccount(req.body.username, req.body.password, req.body.passwordconfirm)) {
          res.redirect("/login");
          return;
        }

      res.render("register", { title: "Register", error: "Something is wrong!" });
    });


    // Login
    app.get("/login", async (req: Request, res: Response) => {
      res.render("login", { title: "Login" });
    });

    // Login
    app.post("/login", async (req: Request, res: Response) => {
      if (req.body.username && req.body.password)
        if (await AccountManager.login(req.session, req.body.username, req.body.password)) {
          res.redirect("/index");
          return;
        }

      res.render("login", { title: "Login", error: "Wrong login!" });
    });

    // Logout
    app.get("/logout", async (req: Request, res: Response) => {
      AccountManager.logout(req.session);
      res.redirect("/index");
    });

    // Not found, send 404 page
    app.use((req: Request, res: Response) => {
      res.status(404);
      res.sendFile(__dirname + "/public/pages/404.html");
    });
  }
}