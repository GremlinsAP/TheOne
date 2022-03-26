import { Pages } from "./pages";
import express from "express";
import helmet from "helmet";
import { Express } from "express-serve-static-core";
import expressLayouts from "express-ejs-layouts";
import bodyParser from 'body-parser';
import { randomUUID } from 'crypto';
import { Database } from "./database";
import { SessionManager } from "./sessionmanager";



const session = require('express-session');
const MongoDbStore = require('connect-mongodb-session')(session);
const cookieParser = require('cookie-parser');

export class App {
    public static readonly instance: App = new App();

    public readonly app: Express = express();
    private readonly env = require('dotenv').config();

    private readonly port = process.env.PORT || 3000;

    private readonly sessionStore = new MongoDbStore({
        uri: Database.url,
        collection: Database.SESSIONS
    });

    constructor() {
        this.app.set('port', this.port);
        this.app.set('view engine', 'ejs');
        this.app.set('layout', './layouts/main');
        this.SetupUsing(); 
        Pages.registerViewLinks(this.app); 
   // SessionManager.wipeSessions();
    }

    public Start(): void {
        this.app.listen(this.port, () => console.log(`[SERVER] App has started listening on port: ${this.port}`));
    }

    private SetupUsing(): void { 
        this.app.use(expressLayouts);
        this.app.use(express.static(__dirname + '/public'))
        this.app.use(express.json());
        this.app.use(helmet());
        this.app.use(cookieParser());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(session({ 
            secret: 'gremlins-ap',
            resave: true, 
            saveUninitialized: true,
            store: this.sessionStore,
            cookie: { maxAge: 24 * 60 * 60 * 60 * 1000} // 1 Day
        }));
    }
}