import { Request, Response } from "express";
import { Express } from "express-serve-static-core";
import { AccountManager } from "../accountmanager";
import { Pages } from "../pages";

export class AccountRoutes {

    public static registerRoutes(app: Express) {

        // Register
        app.get("/register", async (req: Request, res: Response) => {
            res.render("register", { title: "Register" });
        });

        app.post("/register", async (req: Request, res: Response) => {
            if (req.body.username && req.body.password && req.body.passwordconfirm)
                if (await AccountManager.createAccount(req.body.username, req.body.password, req.body.passwordconfirm)) {
                    res.redirect("/login");
                    return;
                }

            res.render("register", await Pages.wrapData(req, "Register", { error: "Something is wrong!" }));
        });


        // Login
        app.get("/login", async (req: Request, res: Response) => {
            res.render("login", await Pages.wrapData(req, "Login", {}));
        });

        app.post("/login", async (req: Request, res: Response) => {
            if (req.body.username && req.body.password)
                if (await AccountManager.login(req.session, req.body.username, req.body.password)) {
                    res.redirect("/index");
                    return;
                }


            res.render("login", await Pages.wrapData(req, "Login", { error: "Wrong login!" }));
        });

        // Logout
        app.get("/logout", async (req: Request, res: Response) => {
            AccountManager.logout(req.session);
            res.redirect("/index");
        });

    }
}