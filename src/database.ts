import { Collection, Db, MongoClient, ServerApiVersion } from "mongodb";
const { config } = require("dotenv").config();

export class Database {

    public static readonly SESSIONS = "session_data";
    public static readonly ACCOUNTS = "accounts";
    public static readonly ACCOUNT_DATA = "account_data";
    public static readonly SCOREBOARD = "scoreboard";

    public static readonly DB_NAME = "theoneapp";
    public static DB_URL: string = `mongodb+srv://gremlins:${process.env.DB_PASS}@blacklistdatabase.7f8b6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

    private static client: MongoClient = new MongoClient(this.DB_URL, { serverApi: ServerApiVersion.v1 });

    private static db: Db;

    private static async Connect() {
        if (this.db) return;
        await this.client.connect().catch(console.log);
        this.db = await this.client.db(this.DB_NAME);
    }

    public static async Disconnect() {
        await this.client.close();
        this.db = undefined!;
    }

    private static GetDatabase() {
        return this.db;
    }

    public static async RunOnCollection<T>(collectionName: string, callback: ICollectionCallback<T>): Promise<T> {
        await this.Connect();
        return await callback(this.GetDatabase().collection(collectionName));
    }

    public static async GetDocument(collectionName: string, search: any): Promise<any> {
        await this.Connect();
        return await this.GetDatabase().collection(collectionName).findOne(search);
    }

    public static async GetDocuments(collectionName: string, search: any): Promise<any[]> {
        await this.Connect();
        const data = await this.GetDatabase().collection(collectionName).find(search).toArray();
        return data;
    }
}

export interface ICollectionCallback<T> {
    (collection: Collection): Promise<T>;
}