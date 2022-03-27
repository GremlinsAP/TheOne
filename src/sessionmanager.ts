import { Database } from "./database";
import { Session } from "express-session"
import { Quiz } from "./quiz";

export class SessionManager {

    public static setup() {
        this.wipeInvalidSessions();
    }

    public static async setupSession(session: AppSession) {
        if (session.data == undefined) session.data = {};
    }

    public static async getDataFromSession(session: AppSession): Promise<AppSessionData> {
        this.setupSession(session);
        return session.data;
    }

    public static async updateSessionData(session: AppSession, callback: { (data: AppSessionData): void }): Promise<AppSessionData> {
        let data: AppSessionData = await this.getDataFromSession(session);
        callback(data);
        session.save();
        return data!;
    }

    private static async wipeInvalidSessions(): Promise<void> {
        let date: Date = new Date(Date.now());
        Database.runOnCollection(Database.SESSIONS, async _coll => {
            let allData: SessionSave[] = await Database.getDocuments(Database.SESSIONS, {});

            allData.forEach(async data => {
                if (data.expires?.getTime()! < date.getTime()) await Database.runOnCollection(Database.SESSIONS, async coll => coll.deleteOne({ expires: data.expires }));
            });
        });
    }
}

export interface SessionSave {
    _id:string;
    expires:Date|undefined;
    session:AppSession;
}

export interface AppSession extends Session {
    data: AppSessionData;
}

export interface AppSessionData {
    quiz?: Quiz;
}

