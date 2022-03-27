import { Database } from "./database";
import { Session } from "express-session"
import { Quiz } from "./quiz";

export class SessionManager {

    public static Setup() {
        this.WipeInvalidSessions();
    }

    private static SetupSession(session: AppSession) {
        if (session.data == undefined) session.data = {};
    }

    public static GetDataFromSession(session: AppSession): AppSessionData {
        this.SetupSession(session);
        return session.data;
    }

    public static UpdateSessionData(session: AppSession, callback: { (data: AppSessionData): void }): AppSessionData {
        let data: AppSessionData = this.GetDataFromSession(session);
        callback(data);
        session.save();
        return data!;
    }

    private static async WipeInvalidSessions(): Promise<void> {
        let date: Date = new Date(Date.now());
        Database.RunOnCollection(Database.SESSIONS, async _coll => {
            let allData: SessionSave[] = await Database.GetDocuments(Database.SESSIONS, {});

            allData.forEach(async data => {
                if (data.expires?.getTime()! < date.getTime()) await Database.RunOnCollection(Database.SESSIONS, async coll => coll.deleteOne({ expires: data.expires }));
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

