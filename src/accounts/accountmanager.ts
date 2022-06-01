
import cryptojs from "crypto-js";
import { ObjectId } from "mongodb";
import { Database } from "../database";
import { Quiz } from "../quiz";
import { IQuoteRate } from "../quoterate";
import { Scoreboard } from "../scoreboard";
import { IAppSession, IAppSessionData, SessionManager } from "../sessionmanager";

export class AccountManager {

    /**
     * Creërt een account van een naam, passwoord (die gehashed word), en controleert of die nog niet bestaat.
     */
    public static async createAccount(username: string, passwordUnhashed: string, passwordUnhashedVerify: string): Promise<boolean> {
        if (await this.doesAccountExist(username) || passwordUnhashed != passwordUnhashedVerify) return false;

        let accountData: IAccountData = {
            favorites: [],
            blacklisted: [],
            canShowOnScoreboard: true,
            nickname: username
        };

        return await Database.RunOnCollection(Database.ACCOUNT_DATA, async (coll) => {
            let dataId: ObjectId = (await coll.insertOne(accountData)).insertedId;

            let account: IAccount = {
                username: username,
                hashedPassword: cryptojs.SHA256(passwordUnhashed).toString(),
                role: IRole.USER,
                dataID: dataId
            }

            await Database.RunOnCollection(Database.ACCOUNTS, async (coll) => await coll.insertOne(account));
            return true;
        });
    }

    /**
     * Als de data juist is wordt de gebruiker ingelogd, accountID wordt toegepast op de sessie
     * En de account data wordt ingeladen in de sessie
     */
    public static async login(session: IAppSession, username: string, passwordUnhashed: string): Promise<boolean> {
        this.logout(session);

        if (await this.isLoginValid(username, passwordUnhashed)) {
            session.accountID = await this.getAccountId(username);
            await SessionManager.MigrateAccountDataToSession(session);

            let sessionData: IAppSessionData = session.data!;

            if (sessionData != undefined) {
                let quiz = new Quiz(sessionData.quiz);
                if (quiz && quiz.IsFinished()) Scoreboard.addEntry(session, quiz.quizType, quiz.GetScore(), quiz.GetPassedQuestionsCount(), quiz.finishedTime);
            }
        }

        return this.isLoggedIn(session);
    }

    /**
     * Log uit, en maak sessie data leeg
     */
    public static logout(session: IAppSession) {
        session.accountID = undefined;
        SessionManager.UpdateSessionData(session, async (data) => {
            data.blacklisted = [];
            data.favorites = [];
        });
    }

    public static isLoggedIn(session: IAppSession): boolean {
        return session != undefined && session.accountID != undefined;
    }

    /**
     * Geeft account info aan de hand van sessie terug uit database
     */
    public static async getAccount(session: IAppSession): Promise<IAccount> {
        return await Database.GetDocument(Database.ACCOUNTS, { _id: session.accountID });
    }

    /**
     * Geeft account data terug (nickname, blacklisted, favorites, canShowOnScoreboard) vanuit database via sessie dataID
     */
    public static async getAccountData(session: IAppSession): Promise<IAccountData> {
        let account: IAccount = await this.getAccount(session);
        let data: IAccountData = await Database.GetDocument(Database.ACCOUNT_DATA, { _id: account.dataID });
        return this.checkData(data);
    }

    /**
     * Geeft account data terug d.m.v accountID
     */
    public static async getAccountDataByAccountID(accountID: ObjectId): Promise<IAccountData> {
        let account: IAccount = await Database.GetDocument(Database.ACCOUNTS, { _id: accountID });
        let data: IAccountData = await Database.GetDocument(Database.ACCOUNT_DATA, { _id: account.dataID });
        return this.checkData(data);
    }

    /**
     * We zorgen ervoor dat de data geen null waarden bevat die de app anders zouden crashen door verkeerde user input
     */
    private static checkData(data: IAccountData): IAccountData {
        return {
            favorites: data.favorites == null ? [] : data.favorites,
            blacklisted: data.blacklisted == null ? [] : data.blacklisted,
            canShowOnScoreboard: data.canShowOnScoreboard,
            nickname: data.nickname
        };
    }


    /**
     * De account data wordt opgevraagd via de sessie, die wordt dan aan de callback meegegeven, en daar wordt de data mogelijk aangepast, en deze aangepaste data wordt opgeslagen in de database.
     */
    public static async UpdateAccountData(session: IAppSession, callback: { (data: IAccountData): Promise<void> }): Promise<IAccountData> {
        let data: IAccountData = await this.getAccountData(session);
        let accountDataID: ObjectId = (await this.getAccount(session)).dataID;
        await callback(data);
        await Database.RunOnCollection(Database.ACCOUNT_DATA, async (coll) => await coll.replaceOne({ _id: accountDataID }, data));
        return data;
    }

    private static async isLoginValid(username: string, passwordUnhashed: string): Promise<boolean> {
        return (await this.doesAccountExist(username)) && (await this.isValidPasswordFor(username, cryptojs.SHA256(passwordUnhashed).toString()));
    }

    /**
     * Verkrijg accountID van de username
     */
    public static async getAccountId(username: string): Promise<ObjectId> {
        return Database.RunOnCollection(Database.ACCOUNTS, async (coll) => {
            let found = await coll.findOne({ username: username });
            return found!._id;
        })
    }

    /**
     * Controleer of het wachtwoord klopt voor deze gebruiker
     */
    private static async isValidPasswordFor(username: string, passwordhashed: string): Promise<boolean> {
        return await Database.RunOnCollection(Database.ACCOUNTS, async (coll) => {
            let account: IAccount = await coll.findOne({ username: username }) as unknown as IAccount;
            return account.hashedPassword == passwordhashed;
        })
    }

    /**
     * Doorzoek database om te zien of het account bestaat
     */
    private static async doesAccountExist(username: string): Promise<boolean> {
        return await Database.RunOnCollection(Database.ACCOUNTS, async (coll) => {
            let accounts: IAccount[] = await coll.find({}).toArray() as unknown as IAccount[];
            return accounts.some(acc => acc.username.toLowerCase() == username.toLowerCase());
        });
    }
}

export interface IAccount {
    username: string;
    hashedPassword: string;
    role: IRole;
    dataID: ObjectId;
}

export interface IAccountData {
    favorites: IQuoteRate[];
    blacklisted: IQuoteRate[];
    canShowOnScoreboard: boolean;
    nickname: string;
}

export enum IRole {
    USER = "User", ADMIN = "Admin"
}