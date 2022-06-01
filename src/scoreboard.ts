import { Session } from "express-session";
import { ObjectId } from "mongodb";
import { AccountManager, IAccount, IAccountData } from "./accounts/accountmanager";
import { Database } from "./database";
import { QuizType } from "./quiz";
import { IAppSession, IAppSessionData } from "./sessionmanager";

export class Scoreboard {

   /**
    * Voegt een score toe aan het scorebord, met account referentie, dit kan ook een scorebord entry editen in het geval dat je score of tijd beter werd.
    */
    public static async addEntry(session: IAppSession, type: QuizType, score: number, questionsGiven: number, time: number) {
        if (AccountManager.isLoggedIn(session)) {
            let account: IAccount = await AccountManager.getAccount(session);
            let data: IAccountData = await AccountManager.getAccountData(session);

            if (data.canShowOnScoreboard) {

                let scoreEntry: IScoreBoardEntry = {
                    accountID: await AccountManager.getAccountId((account.username)),
                    name: data.nickname,
                    type: type,
                    score: score,
                    time: time
                }

                if (type == QuizType.SUDDENDEATH) scoreEntry.maxScore = questionsGiven;


                await Database.RunOnCollection(Database.SCOREBOARD, async (coll) => {
                    let foundEntry: IScoreBoardEntry = await coll.findOne({ accountID: scoreEntry.accountID, type: type }) as unknown as IScoreBoardEntry;

                    if (foundEntry == undefined) await coll.insertOne(scoreEntry);
                    else if (foundEntry.score < score || foundEntry.time > time && foundEntry.score <= score) await coll.replaceOne({ accountID: scoreEntry.accountID, type: type }, scoreEntry);
                });
            }
        }
    }

    public static async updateName(session: IAppSession) {
        await Database.RunOnCollection(Database.SCOREBOARD, async (db) => {
            let data = await AccountManager.getAccountData(session);
            await db.updateMany({ accountID: session.accountID }, { $set: { name: data.nickname } })
        })
    }

    public static async removeAllEntries() {
        await Database.RunOnCollection(Database.SCOREBOARD, async (coll) => coll.deleteMany({}));
    }

    public static async removeAccountEntry(session: IAppSession) {
        let account: IAccount = await AccountManager.getAccount(session);
        await Database.RunOnCollection(Database.SCOREBOARD, async (coll) => {
            await coll.deleteMany({ accountID: await AccountManager.getAccountId(account.username) });
        });
    }

    public static async getEntries(type: QuizType): Promise<IScoreBoardEntry[]> {
        let entries: IScoreBoardEntry[] = await Database.GetDocuments(Database.SCOREBOARD, { type: type });
        let filtered: IScoreBoardEntry[] = [];

       for(let x = 0; x < entries.length; x++) {
        let entry = entries[x];
        if ((await AccountManager.getAccountDataByAccountID(entry.accountID)).canShowOnScoreboard)filtered.push(entry);
       }

        return filtered;
    }

    public static sort(entries: IScoreBoardEntry[]) {
        return entries.sort((a, b) => a.score > b.score ? -1 : (a.score == b.score ? (a.time > b.time ? 1 : (a.time == b.time ? 0 : -1)) : 1));
    }
}

export interface IScoreBoardEntry {
    accountID: ObjectId;
    name: string;
    score: number;
    time: number;
    maxScore?: number;
    type: QuizType;
}