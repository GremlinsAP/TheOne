import { Database } from "./database";
import { Session } from "express-session"
import { Quiz } from "./quiz";

export class SessionManager {

    public static Setup() {
        this.WipeAllSessions();
        this.WipeInvalidSessions();
    }

    private static PopulateSession(session: AppSession) {
        if (session.data == undefined) session.data = {};
    }

    public static GetDataFromSession(session: AppSession): AppSessionData {
        this.PopulateSession(session);
        return session.data!;
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
                if (data.expires?.getTime()! < date.getTime()) await Database.RunOnCollection(Database.SESSIONS, async coll => coll.deleteOne({ _id: data._id }));
            });
        });
    }

    private static async WipeAllSessions(): Promise<void> {
        Database.RunOnCollection(Database.SESSIONS, async _coll => {
            _coll.deleteMany({});
        });
    }
}

export interface SessionSave {
    _id: string;
    expires: Date | undefined;
    session: AppSession;
}

export interface AppSession extends Session {
    data?: AppSessionData;
}

export interface AppSessionData {
    quiz?: Quiz;
}