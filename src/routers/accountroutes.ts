import { Request, Response } from "express";
import { Express } from "express-serve-static-core";
import { realpath } from "fs";
import { AccountManager } from "../accounts/accountmanager";
import { Pages } from "../pages";
import { Scoreboard } from "../scoreboard";

export class AccountRoutes {

    public static registerRoutes(app: Express) {

        // Register
        app.get("/register", async (req: Request, res: Response) => {
            res.render("register", await Pages.wrapData(req, "Register", {}));
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
            if (!AccountManager.isLoggedIn(req.session)) {
                res.render("login", await Pages.wrapData(req, "Login", {}));
                return;
            } res.redirect("/index");
        });

        app.post("/login", async (req: Request, res: Response) => {
            if (!AccountManager.isLoggedIn(req.session)) {
                if (req.body.username && req.body.password) {
                    if (await AccountManager.login(req.session, req.body.username, req.body.password)) {
                        res.redirect("/index");
                        return;
                    }
                }
            }

            res.render("login", await Pages.wrapData(req, "Login", { error: "Wrong login!" }));
        });

        // Logout
        app.get("/logout", async (req: Request, res: Response) => {
            if (AccountManager.isLoggedIn(req.session)) AccountManager.logout(req.session);
            res.redirect("/index");
        });


        app.get("/user-settings", async (req: Request, res: Response) => {
            if (AccountManager.isLoggedIn(req.session)) res.render("user-settings", await Pages.wrapData(req, "User Settings", {}));
            else res.redirect("/index");
        });

        app.post("/user-settings", async (req: Request, res: Response) => {
            
            if (req.body.username && !req.body.clearsession && req.body.username.trim().length > 3) {
                await AccountManager.UpdateAccountData(req.session, async (data) => {
                    data.canShowOnScoreboard = req.body.showscore != undefined;
                    data.nickname = req.body.username.trim();
                });
            } else if (req.body.clearsession) {
                await Scoreboard.removeAccountEntry(req.session);
                await AccountManager.UpdateAccountData(req.session, async (data) => {
                    data.blacklisted = [],
                    data.favorites = []
                });
            }

            res.redirect("/user-settings")
        });
    }
}