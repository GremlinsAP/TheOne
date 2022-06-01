import { Request, Response } from "express";
import { Express } from "express-serve-static-core";
import { QuizType } from "../quiz";
import { Scoreboard } from "../scoreboard";

export class ScoreboardRoutes {

    public static registerRoutes(app: Express) {

        /**
         * Geeft een json terug, in een gesorteerde vorm, van grootste score naar klein, in combinatie met tijd.
         */
        app.get("/scoreboard/:type", async (req: Request, res: Response) => {
            res.json(Scoreboard.sort(await Scoreboard.getEntries(req.params.type as QuizType)));
        });

    }
}