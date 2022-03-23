import { Db, MongoClient } from "mongodb";

export class Database {
    private static readonly url = 'mongodb://localhost:27017';
    private static readonly client = new MongoClient(this.url);

    private static DB: Db;
    
    private static readonly db_name = "theoneapp";

    public static async connect() {
        await this.client.connect();
        console.log("Connected succesfully to the database.");

        this.DB = this.client.db(this.db_name);
    }

    
}