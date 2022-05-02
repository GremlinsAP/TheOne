
import cryptojs from "crypto-js";
import { ObjectId } from "mongodb";
import { Database } from "./database";
import { IQuoteRate } from "./quoterate";
import { IAppSession, SessionManager } from "./sessionmanager";

export class AccountManager {

    public static async createAccount(username: string, passwordUnhashed: string, passwordUnhashedVerify: string): Promise<boolean> {
        if (await this.doesAccountExist(username) || passwordUnhashed != passwordUnhashedVerify) return false;

        let accountData: IAccountData = {
            favorites: [],
            blacklisted: [],
            canShowOnScoreboard: true
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

    public static async login(session: IAppSession, username: string, passwordUnhashed: string): Promise<boolean> {
        this.logout(session);

        if (await this.isLoginValid(username, passwordUnhashed)) {
            session.accountID = await this.getAccountId(username);
            await SessionManager.MigrateAccountDataToSession(session);
        }

        return this.isLoggedIn(session);
    }

    public static logout(session: IAppSession) {
        session.accountID = undefined;
    }

    public static isLoggedIn(session: IAppSession): boolean {
        return session != undefined && session.accountID != undefined;
    }

    public static async getAccount(session: IAppSession): Promise<IAccount> {
        return await Database.GetDocument(Database.ACCOUNTS, { _id: session.accountID });
    }

    public static async getAccountData(session: IAppSession): Promise<IAccountData> {
        let account: IAccount = await this.getAccount(session);
        let data: IAccountData = await Database.GetDocument(Database.ACCOUNT_DATA, { _id: account.dataID });
        return this.checkData(data);
    }

    private static checkData(data: IAccountData): IAccountData {
        return {
            favorites: data.favorites == null ? [] : data.favorites,
            blacklisted: data.blacklisted == null ? [] : data.blacklisted,
            canShowOnScoreboard: true
        };
    }

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

    public static async getAccountId(username: string): Promise<ObjectId> {
        return Database.RunOnCollection(Database.ACCOUNTS, async (coll) => {
            let found = await coll.findOne({ username: username });
            return found!._id;
        })
    }

    private static async isValidPasswordFor(username: string, passwordhashed: string): Promise<boolean> {
        return await Database.RunOnCollection(Database.ACCOUNTS, async (coll) => {
            let account: IAccount = await coll.findOne({ username: username }) as unknown as IAccount;
            return account.hashedPassword == passwordhashed;
        })
    }

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
}

export enum IRole {
    USER = "User", ADMIN = "Admin"
}