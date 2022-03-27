import { Collection, Db, MongoClient, ServerApiVersion } from "mongodb";
const { config } = require("dotenv").config();

export class Database {

    public static readonly INSTANCE: Database = new Database();

    public static SESSIONS = "session_data";
    public static BLACKLIST = "blacklists";
    public static FAVORITES = "favorites";

    public static readonly DB_NAME = "theoneapp";
    public static DB_URL: string = `mongodb+srv://gremlins:${process.env.DB_PASS}@blacklistdatabase.7f8b6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
    private static client: MongoClient = new MongoClient(this.DB_URL, { serverApi: ServerApiVersion.v1 });

    private static db: Db;

    private static async Connect() {
        await this.client.connect().catch(console.log);
        this.db = this.GetDatabase();
    }

    private static GetDatabase() {
        return this.client.db(this.DB_NAME);
    }

    public static async RunOnCollection<T>(collectionName: string, callback: CollectionCallback<T>): Promise<T> {
        if (!this.db) await this.Connect();
        return await callback(this.GetDatabase().collection(collectionName));
    }

    public static async GetDocument(collectionName: string, search: any): Promise<any> {
        if (!this.db) await this.Connect();
        const data = this.GetDatabase().collection(collectionName).findOne(search);
        return data;
    }

    public static async GetDocuments(collectionName: string, search: any): Promise<any[]> {
        if (!this.db) await this.Connect();
        const data = this.GetDatabase().collection(collectionName).find(search).toArray();
        return data;
    }
}

export interface CollectionCallback<T> {
    (collection: Collection): Promise<T>;
}