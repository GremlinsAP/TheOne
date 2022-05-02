import { Request, Response } from "express";
import { Express } from "express-serve-static-core";
import path from "path";
import { ICharacter, IQuote } from "../api";
import { Pages } from "../pages";
import { IQuoteRate } from "../quoterate";
import { CharacterPath, Util } from "../utils";

export class DefaultRoutes {

    public static registerRoutes(app: Express) {

        // Landing
        app.get("/", async (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            res.sendFile(path.join(__dirname, '../public', '/pages/landing.html'));
        });

        // Index
        app.get("/index", async (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            res.render("index", await Pages.wrapData(req, "Index", {}));
        });

        // Favorites
        app.get("/favorites", async (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            let ratesFavorites: IQuoteRate[] = await Util.INSTANCE.getFavouritedQuotesRates(req.session);
            let favorites: IQuote[] = await Util.INSTANCE.getFavouritedQuotes(req.session);
            let characters: ICharacter[] = ((await Util.INSTANCE.GetData(CharacterPath)) as ICharacter[]).filter((char) => favorites.map((c) => c.character).includes(char._id));

            res.render("favorites", await Pages.wrapData(req, "Favorites", {
                favoritedQuotes: favorites,
                rates: ratesFavorites,
                characters: characters
            }));
        });

        // Blacklist
        app.get("/blacklist", async (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);

            let ratesBlacklist: IQuoteRate[] = Util.INSTANCE.getBlacklistedQuotesRates(req.session);
            let blacklisted: IQuote[] = await Util.INSTANCE.getBlacklistedQuotes(req.session);

            res.render("blacklist", await Pages.wrapData(req, "Blacklist", {
                blacklistedQuotes: blacklisted,
                rates: ratesBlacklist
            }));
        });
    }
}