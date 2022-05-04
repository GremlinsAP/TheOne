import { Express } from "express-serve-static-core";
import { Quiz, IQuizData } from "./quiz";
import { Request, Response } from "express";
import { CharacterPath, Util, } from "./utils";
import { IQuoteRate, QuoteRate } from "./quoterate";
import { ICharacter, IQuote } from "./api";
import { Database } from "./database";
import { IAppSession, IAppSessionData, ISessionSave, SessionManager } from "./sessionmanager";

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
      let ratesFavorites: IQuoteRate[] = Util.INSTANCE.getFavouritedQuotesRates(
        req.session
      );
      let favorites: IQuote[] = await Util.INSTANCE.getFavouritedQuotes(
        req.session
      );
      let characters: ICharacter[] = (
        (await Util.INSTANCE.GetData(CharacterPath)) as ICharacter[]
      ).filter((char) => favorites.map((c) => c.character).includes(char._id));
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
      let ratesBlacklist: IQuoteRate[] = Util.INSTANCE.getBlacklistedQuotesRates(req.session);
      let blacklisted: IQuote[] = await Util.INSTANCE.getBlacklistedQuotes(req.session);

      res.render("blacklist", {
        title: "Blacklist",
        blacklistedQuotes: blacklisted,
        rates: ratesBlacklist
      });
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
        res.sendStatus(200);
      }
    });

    app.get("/rate/:quoteId", (req: Request, res: Response) => {
      let quoteId = req.params.quoteId;
      res.status(200).json({
        favorite: QuoteRate.isFavorite(req.session, quoteId),
        blacklisted: QuoteRate.isBlacklisted(req.session, quoteId)
      });
    });

    app.get("/scoreboard", async (req: Request, res: Response) => {
      let sessionSaves: ISessionSave[] = await Database.GetDocuments(Database.SESSIONS, {});
      let scoreBoardEntries: ScoreBoardEntry[] = [];

      sessionSaves.forEach(sesSave => {
        let data: IAppSessionData = sesSave.session.data!;
        if (data != undefined && data.username != undefined && data.highscore != undefined) {
          scoreBoardEntries.push({ name: data.username, score: data.highscore });
        }
      });

      res.json(scoreBoardEntries.sort((a, b) => a.score > b.score ? -1 : a.score == b.score ? 0 : 1));
    });

    app.get("/session-settings",(req: Request, res: Response) => {
      res.json({ username: SessionManager.GetDataFromSession(req.session).username })
    });

    app.get("/downloadfavourites",async (req:Request,res:Response)=>{
      let list =await Util.INSTANCE.UpdateFavoriteFile(req.session);
      res.download("src/public/assets/text/favorite.txt",(error)=>{
        if(error)console.log(error);
      })
    })
    app.post("/session-settings", (req: Request, res: Response) => {
      if (req.body != undefined && req.body.username != undefined)
        SessionManager.UpdateSessionData(req.session, (sessionStorage) => sessionStorage.username = req.body.username);

      let session: IAppSession = req.session;

      if (session.data != undefined && session.data.quiz != undefined && session.data.highscore == undefined) {
        session.data!.username = session.data!.username;
        session.data!.highscore = session.data!.highscore == undefined || session.data!.highscore! < session.data.quiz.GetScore() ? session.data.quiz.GetScore() : session.data!.highscore;
      }
    });

    // Not found, send 404 page
    app.use((req: Request, res: Response) => {
      res.status(404);
      res.sendFile(__dirname + "/public/pages/404.html");
    });
  }
}

export interface PageData {
  title?: string;
}

export interface ScoreBoardEntry {
  name: string;
  score: number;
}
