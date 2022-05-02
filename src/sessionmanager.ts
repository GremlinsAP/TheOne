import { Database } from "./database";
import { Session } from "express-session"
import { Quiz } from "./quiz";
import { ObjectId } from "mongodb";
import { IQuoteRate } from "./quoterate";
import { AccountManager, IAccountData } from "./accountmanager";

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

    public static async UpdateSessionData(session: IAppSession, callback: { (data: IAppSessionData): Promise<void> }): Promise<IAppSessionData> {
        let data: IAppSessionData = this.GetDataFromSession(session);
        await callback(data);
        session.save();
        return data!;
    }

    public static async MigrateSessionDataToAccount(session: IAppSession) {
        if (AccountManager.isLoggedIn(session)) {
            await AccountManager.UpdateAccountData(session, async (data) => {
                let sessionData: IAppSessionData = this.GetDataFromSession(session);
                data.blacklisted = sessionData.blacklisted;
                data.favorites = sessionData.favorites;
            });
        }
    }

    public static async MigrateAccountDataToSession(session: IAppSession) {
        if (AccountManager.isLoggedIn(session)) {
            await SessionManager.UpdateSessionData(session, async (data) => {
                let accountData: IAccountData = await AccountManager.getAccountData(session);
                data.blacklisted = accountData.blacklisted;
                data.favorites = accountData.favorites;
            });
        }
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

    // Don't use, this is when really required, due to breaking changes
    private static async WipeAllSessions(): Promise<void> {
        Database.RunOnCollection(Database.SESSIONS, async _coll => _coll.deleteMany({}));
    }
}

export interface ISessionSave {
    _id: string;
    expires: Date | undefined;
    session: IAppSession;
}

export interface IAppSession extends Session {
    accountID?: ObjectId;
    data?: IAppSessionData;
}

export interface IAppSessionData {
    quiz?: Quiz;
    favorites: IQuoteRate[];
    blacklisted: IQuoteRate[];
    highscore?: number;
}

