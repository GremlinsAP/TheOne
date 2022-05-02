import { Request, Response } from "express";
import { Express } from "express-serve-static-core";
import { Pages } from "../pages";
import { IQuizData, Quiz, QuizType } from "../quiz";

export class QuizRoutes {

    public static registerRoutes(app: Express) {

        // Quiz get
        app.get("/quiz", async (req: Request, res: Response) => {
            res.type("text/html");
            res.status(200);
            res.render("quiz", await Pages.wrapData(req, "Quiz", {}));
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

    }
}