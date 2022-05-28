import { Request, Response } from "express";
import { Express } from "express-serve-static-core";
import path from "path";
import { ICharacter, IQuote } from "../api";
import { Pages, updateSession } from "../pages";
import { IQuoteRate } from "../quoterate";
import { CharacterPath, Util } from "../utils";
import { WebCrawler } from "../WebCrawler";

export class DefaultRoutes {

    public static registerRoutes(app: Express) {

        // Landing
        app.get("/", async (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            res.sendFile(path.join(__dirname, '../../public', '/pages/landing.html'));
        });

        // Index
        app.get("/index", updateSession, async (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            res.render("index", await Pages.wrapData(req, "Index", {}));
        });

        // Favorites
        app.get("/favorites", updateSession, async (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            let ratesFavorites: IQuoteRate[] = await Util.INSTANCE.getFavouritedQuotesRates(req.session);
            let favorites: IQuote[] = await Util.INSTANCE.getFavouritedQuotes(req.session);
            let characters: ICharacter[] = ((await Util.INSTANCE.GetData(CharacterPath)) as ICharacter[]).filter((char) => favorites.map((c) => c.character).includes(char._id));

            let crawl = new WebCrawler();
            for (let x = 0; x < characters.length; x++) {
                characters[x].imageLocation = await (await crawl.ScrapeImage(characters[x].name)).replace("./public/", "")
                if (characters[x].imageLocation == "") characters[x].imageLocation = "assets/icon/ring.svg"
            }


            res.render("favorites", await Pages.wrapData(req, "Favorites", {
                favoritedQuotes: favorites,
                rates: ratesFavorites,
                characters: characters
            }));
        });
        app.get("/favoritecharacters", updateSession, async (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            let favorites: IQuote[] = await Util.INSTANCE.getFavouritedQuotes(req.session);
            let characters: ICharacter[] = ((await Util.INSTANCE.GetData(CharacterPath)) as ICharacter[]).filter((char) => favorites.map((c) => c.character).includes(char._id));
            /*
            Icharacter heeft een nulable array voor favourited quotes
            deze kan je hier aan toevoegen.
            */
            let crawl = new WebCrawler();
            for (let x = 0; x < characters.length; x++) {
                characters[x].imageLocation = await (await crawl.ScrapeImage(characters[x].name)).replace("./public/", "")
                if (characters[x].imageLocation == "") characters[x].imageLocation = "assets/icon/ring.svg"
            }


            res.render("favoriteCharacters", await Pages.wrapData(req, "favoriteCharacters", {
                characters: characters
            }));
        });

        // Blacklist
        app.get("/blacklist", updateSession, async (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);

            let ratesBlacklist: IQuoteRate[] = Util.INSTANCE.getBlacklistedQuotesRates(req.session);
            let blacklisted: IQuote[] = await Util.INSTANCE.getBlacklistedQuotes(req.session);
            let characters: ICharacter[] = ((await Util.INSTANCE.GetData(CharacterPath)) as ICharacter[]).filter((char) => blacklisted.map((c) => c.character).includes(char._id));

            let crawl = new WebCrawler();
            for (let x = 0; x < characters.length; x++) {
                characters[x].imageLocation = await (await crawl.ScrapeImage(characters[x].name)).replace("./public/", "")
                if (characters[x].imageLocation == "") characters[x].imageLocation = "assets/icon/ring.svg"
            }

            res.render("blacklist", await Pages.wrapData(req, "Blacklist", {
                blacklistedQuotes: blacklisted,
                rates: ratesBlacklist,
                characters: characters
            }));
        });
    }
}