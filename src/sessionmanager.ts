import { Collection } from "mongodb";
import { Database } from "./database";
//import { Session } from "express-session"

export class SessionManager {

    public static getAllSessions() {
        Database.runOnCollection(Database.SESSIONS, async (coll: Collection) => {
            const temp = await coll.find({}).toArray();
            console.log(temp);
        });
    }

    /*public static addSession(session:Session) {
        
    }*/
}