import { Database } from "./database";
import cryptojs from "crypto-js";
import { IAppSession } from "./sessionmanager";
import { ObjectId } from "mongodb";

export class AccountManager {

    public static async createAccount(username: string, passwordUnhashed: string, passwordUnhashedVerify: string) {
        if (await this.doesAccountExist(username) || passwordUnhashed != passwordUnhashedVerify) return;

        let accountData: IAccountData = {

        };

        Database.RunOnCollection(Database.ACCOUNT_DATA, async (coll) => {
            let dataId: ObjectId = (await coll.insertOne(accountData)).insertedId;

            let account: IAccount = {
                username: username,
                hashedPasswored: cryptojs.SHA256(passwordUnhashed).toString(),
                role: IRole.USER,
                dataID: dataId
            }

            await Database.RunOnCollection(Database.ACCOUNTS, async (coll) => coll.insertOne(account));
        });
    }

    public static async login(session: IAppSession, username: string, passwordUnhashed: string): Promise<boolean> {
        if (await this.isLoginValid(username, passwordUnhashed)) session.accountID = await this.getAccountId(username);
        return this.isLoggedIn(session);
    }

    public static logout(session: IAppSession) {
        session.accountID = undefined;
    }

    public static isLoggedIn(session: IAppSession): boolean {
        return session.accountID != undefined;
    }

    public static async getAccount(session: IAppSession): Promise<IAccount> {
        return await Database.GetDocument(Database.ACCOUNTS, { _id: session.accountID });
    }

    public static async getAccountData(session: IAppSession): Promise<IAccountData> {
        let account: IAccount = await this.getAccount(session);
        return await Database.GetDocument(Database.ACCOUNT_DATA, { _id: account.dataID });
    }

    private static async isLoginValid(username: string, passwordUnhashed: string): Promise<boolean> {
        return (await this.doesAccountExist(username)) && (await this.isValidPasswordFor(username, cryptojs.SHA256(passwordUnhashed).toString()));
    }

    private static async getAccountId(username: string): Promise<ObjectId> {
        return Database.RunOnCollection(Database.ACCOUNTS, async (coll) => {
            let found = await coll.findOne({ username: username });
            return found!._id;
        })
    }

    private static async isValidPasswordFor(username: string, passwordhashed: string): Promise<boolean> {
        return await Database.RunOnCollection(Database.ACCOUNTS, async (coll) => {
            let account: IAccount = await coll.findOne({ username: username }) as unknown as IAccount;
            return account.hashedPasswored == passwordhashed;
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
    hashedPasswored: string;
    role: IRole;
    dataID: ObjectId;
}

export interface IAccountData {

}

export enum IRole {
    USER, ADMIN
}