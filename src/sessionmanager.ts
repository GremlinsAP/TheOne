import { Collection, WithId } from "mongodb";
import { Database } from "./database";
//import { Session } from "express-session"

export class SessionManager {

    public static async getAllSessions() {
    
        let sessions = await Database.runOnCollection(Database.SESSIONS, async (coll: Collection) => {
           return await coll.find({}).toArray();
        });

        return sessions;
    }

    /*public static addSession(session:Session) {
        
    }*/
}