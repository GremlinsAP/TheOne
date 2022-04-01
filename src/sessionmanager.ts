import { Database } from "./database";
import { Session } from "express-session"
import { Quiz } from "./quiz";

export class SessionManager {

    public static Setup() {
        this.WipeInvalidSessions();
    }

    private static PopulateSession(session: IAppSession) {
        if (session.data == undefined) session.data = {
            favorites: [],
            blacklisted: []
        };
    }

    public static GetDataFromSession(session: IAppSession): IAppSessionData {
        this.PopulateSession(session);
        return session.data!;
    }

    public static UpdateSessionData(session: IAppSession, callback: { (data: IAppSessionData): void }): IAppSessionData {
        let data: IAppSessionData = this.GetDataFromSession(session);
        callback(data);
        session.save();
        return data!;
    }

    private static async WipeInvalidSessions(): Promise<void> {
        let date: Date = new Date(Date.now());
        Database.RunOnCollection(Database.SESSIONS, async _coll => {
            let allData: ISessionSave[] = await Database.GetDocuments(Database.SESSIONS, {});

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

export interface ISessionSave {
    _id: string;
    expires: Date | undefined;
    session: IAppSession;
}

export interface IAppSession extends Session {
    data?: IAppSessionData;
}

export interface IAppSessionData {
    quiz?: Quiz;
    favorites: IQuoteRate[];
    blacklisted: IQuoteRate[];
}

export interface IQuoteRate {
    quoteId:string; 
    reason:string;
}