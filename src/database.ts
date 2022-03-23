import { Collection, Db, MongoClient, ServerApiVersion } from "mongodb";
require('dotenv').config();

export class Database {

    public static SESSIONS = "session_data";
    public static BLACKLIST = "blacklist";
    public static FAVORITES = "favorites";

    private static readonly url = `mongodb+srv://gremlins:${process.env.DB_PASS}@blacklistdatabase.7f8b6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
    private static readonly client = new MongoClient(this.url, { serverApi: ServerApiVersion.v1 });

    private static DB: Db;

    private static readonly db_name = "theoneapp";

    public static async connect() {
        await this.client.connect();
        this.DB = this.client.db(this.db_name);
    }

    public static async runOnCollection(collectionName: string, callback: CollectionCallback) {
        if (!this.DB) await this.connect();
        const collection: Collection = this.DB.collection(collectionName);
        return await callback(collection);
    }
}

export interface CollectionCallback {
    (collection: Collection): Promise<any>;
}