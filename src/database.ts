import { Collection, Db, MongoClient, ServerApiVersion, WithId } from "mongodb";
require('dotenv').config();

export class Database {

    public static readonly INSTANCE: Database = new Database();

    public static SESSIONS = "session_data";
    public static BLACKLIST = "blacklists";
    public static FAVORITES = "favorites";

    private static readonly db_name = "theoneapp";
    private static url: string = `mongodb+srv://gremlins:${process.env.DB_PASS}@blacklistdatabase.7f8b6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
    private static client: MongoClient = new MongoClient(this.url, { serverApi: ServerApiVersion.v1 });

    private static db: Db;

    private static async connect() {
        await this.client.connect().catch(console.log);
        this.db = this.getDatabase();
    }

    private static getDatabase() {
        return this.client.db(this.db_name);
    }

    public static async runOnCollection<T>(collectionName: string, callback: CollectionCallback<T>): Promise<T> {
        if (!this.db) await this.connect();
        const collection: Collection = this.getDatabase().collection(collectionName);
        return await callback(collection);
    }

    public static async getDocument(collectionName: string, search: any): Promise<any> {
        if (!this.db) await this.connect();
        const collection: Collection = this.getDatabase().collection(collectionName);
        const data = collection.findOne(search);
        return data;
    }
}

export interface CollectionCallback<T> {
    (collection: Collection): Promise<T>;
}