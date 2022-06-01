import { Request, Response } from "express";
import { Express } from "express-serve-static-core";
import { updateSession } from "../pages";
import { QuoteRate } from "../quoterate";
import { SessionManager } from "../sessionmanager";
import { Util } from "../utils";

export class RatingRoutes {

    public static registerRoutes(app: Express) {

       /**
        * Op basis van de body data, kiest men of men een quote verwijdert, toevoegd, of bewerkt voor blacklist
        */
        app.post("/rate-quote", updateSession, async (req: Request, res: Response) => {
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

                await SessionManager.MigrateSessionDataToAccount(session);
                res.sendStatus(200);
            }
        });

        /**
         * Verkrijg data over een quote, of die blacklisted of favorite is
         */
        app.get("/rate/:quoteId", (req: Request, res: Response) => {
            let quoteId = req.params.quoteId;
            res.status(200).json({
                favorite: QuoteRate.isFavorite(req.session, quoteId),
                blacklisted: QuoteRate.isBlacklisted(req.session, quoteId)
            });
        });

        app.get("/downloadfavourites", async (req: Request, res: Response) => {
            await Util.INSTANCE.UpdateFavoriteFile(req.session);
            res.download("public/assets/text/favorite.txt", (error) => {
                if (error) console.log(error);
            })
        })

        app.get("/downloadfavoriteCharacters", async (req: Request, res: Response) => {
            await Util.INSTANCE.UpdateFavoriteCharacterFile(req.session);
            res.download("public/assets/text/favoriteCharacters.txt", (error) => {
                if (error) console.log(error);
            })
        })
    }
}