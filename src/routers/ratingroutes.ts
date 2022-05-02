import { Request, Response } from "express";
import { Express } from "express-serve-static-core";
import { QuoteRate } from "../quoterate";
import { SessionManager } from "../sessionmanager";

export class RatingRoutes {

    public static registerRoutes(app: Express) {

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
    }
}