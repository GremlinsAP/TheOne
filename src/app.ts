import { Pages } from "./pages";

export class App {
    public static readonly instance: App = new App();

    public readonly express = require("express");
    public readonly app = this.express();
    private readonly ejs = require('ejs');
    private readonly env = require('dotenv').config();

    private readonly port = process.env.PORT || 3000;

    constructor() {
        this.app.set('port', this.port);
        this.app.set('view engine', 'ejs');
        this.SetupUsing();

        Pages.SetupViews(this.app);
    }

    public Start(): void {
        this.app.listen(this.port, () => console.log(`[SERVER] App has started listening on port: ${this.port}`));
    }

    private SetupUsing(): void {
        this.app.use(this.express.static(__dirname + '/public'))
    }
}