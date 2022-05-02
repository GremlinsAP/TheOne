import { Express } from "express-serve-static-core";
import { Request, Response } from "express";
import path from "path";
import { AccountRoutes } from "./routers/accountroutes";
import { DefaultRoutes } from "./routers/defaultroutes";
import { QuizRoutes } from "./routers/quizroutes";
import { RatingRoutes } from "./routers/ratingroutes";
import { ScoreboardRoutes } from "./routers/scoreboardroutes";
import { AccountManager, IAccount, IAccountData, IRole } from "./accountmanager";

export class Pages {
  public static registerViewLinks(app: Express): void {

    DefaultRoutes.registerRoutes(app);
    QuizRoutes.registerRoutes(app);
    RatingRoutes.registerRoutes(app);
    ScoreboardRoutes.registerRoutes(app);
    AccountRoutes.registerRoutes(app);

    // Not found, send 404 page
    app.use((req: Request, res: Response) => {
      res.status(404);
      res.sendFile(path.join(__dirname, '../public', '/pages/404.html'));
    });
  }

  public static async wrapData(req: Request, name: string, obj: any): Promise<any> {
    let dD: IDefaultData = {
      title: name,
      isLoggedIn: AccountManager.isLoggedIn(req.session)
    }

    if (dD.isLoggedIn) {
      let account: IAccount = await AccountManager.getAccount(req.session);

      dD.loggedInInfo = {
        username: account.username,
        role: account.role
      }
    }

    return { ...dD, ...obj };
  }
}

export interface IDefaultData {
  title: string;

  isLoggedIn: boolean;
  loggedInInfo?: ILoggedInInfo;
}

export interface ILoggedInInfo {
  username: string;
  role: IRole;
}