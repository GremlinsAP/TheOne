import { Collection, WithId } from "mongodb";
import { Database } from "./database";
import { Session } from "express-session"
import { Quiz } from "./quiz";

export class SessionManager {

    /*public static async getAllSessions() {

        let sessions = await Database.runOnCollection(Database.SESSIONS, async (coll: Collection) => {
            return await coll.find({}).toArray();
        });

        return sessions;
    }*/


    public static addSession(session: Session): void {
        // Add to mongo db if session id does not exist
        throw Error("Not implmented yet");
    }

    public static getDataFromSession(session: Session): SessionData {
        throw Error("Not implmented yet");
    }

    public static wipeSessions(): void {
        throw Error("Not implmented yet");
    }
}

export interface SessionData {
    quiz: Quiz
}