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

    public static MigrateSessionDataToAccount(session: IAppSession) {
        if (AccountManager.isLoggedIn(session)) {
            console.log("Migrated Session to Account");
            AccountManager.UpdateAccountData(session, (data) => {
                let sessionData: IAppSessionData = this.GetDataFromSession(session);

                sessionData.blacklisted.forEach(bi => {
                    if (!data.blacklisted.some(bis => bis.quoteId == bi.quoteId)) data.blacklisted.push(bi);
                });

                sessionData.favorites.forEach(fi => {
                    if (!data.favorites.some(fis => fis.quoteId == fi.quoteId)) data.favorites.push(fi);
                });

                // TODO QUIZ STUFF FOR SCORE
            });
        }
    }

    public static async MigrateAccountDataToSession(session: IAppSession) {
        if (AccountManager.isLoggedIn(session)) {
            console.log("Migrated Account to Session");

            SessionManager.UpdateSessionData(session, async (data) => {
                let accountData: IAccountData = await AccountManager.getAccountData(session);

             
                accountData.blacklisted.forEach(bi => {
                    if (!data.blacklisted.some(bis => bis.quoteId == bi.quoteId)) data.blacklisted.push(bi);
                });

                accountData.favorites.forEach(fi => {
                    if (!data.favorites.some(fis => fis.quoteId == fi.quoteId)) data.favorites.push(fi);
                });

                // TODO QUIZ STUFF FOR SCORE
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

