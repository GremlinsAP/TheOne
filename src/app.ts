import { Pages } from "./pages";
import express from "express";
import helmet from "helmet";
import { Express } from "express-serve-static-core";
import expressLayouts from "express-ejs-layouts";

export class App {
    public static readonly instance: App = new App();

    public readonly app: Express = express();
    private readonly ejs = require('ejs');
    private readonly env = require('dotenv').config();

    private readonly port = process.env.PORT || 3000;

    constructor() {
        this.app.set('port', this.port);
        this.app.set('view engine', 'ejs');
        this.app.set('layout', './layouts/main');
        this.SetupUsing();
        Pages.setup(this.app);
    }

    public Start(): void {
        this.app.listen(this.port, () => console.log(`[SERVER] App has started listening on port: ${this.port}`));
    }

    private SetupUsing(): void {
        this.app.use(expressLayouts);
        this.app.use(express.static(__dirname + '/public'))
        this.app.use(express.json());
        this.app.use(helmet());
    }
}