import { ObjectId } from "mongodb";
import { AccountManager, IAccount } from "./accounts/accountmanager";
import { Database } from "./database";
import { QuizType } from "./quiz";
import { IAppSession } from "./sessionmanager";

export class Scoreboard {

    /**
     * It adds a score entry to the database
     * @param {IAppSession} session - IAppSession - The session of the user
     * @param {QuizType} type - QuizType
     * @param {number} score - number, time: number
     * @param {number} time - number - The time it took to complete the quiz
     */
    public static async addEntry(session: IAppSession, type: QuizType, score: number, time: number) {
        if (AccountManager.isLoggedIn(session)) {
            let account: IAccount = await AccountManager.getAccount(session);

            if ((await AccountManager.getAccountData(session)).canShowOnScoreboard) {

                let scoreEntry: IScoreBoardEntry = {
                    accountID: await AccountManager.getAccountId((account.username)),
                    name: account.username,
                    type: type,
                    score: score,
                    time: time
                }

                await Database.RunOnCollection(Database.SCOREBOARD, async (coll) => {
                    if (await coll.findOne({ accountID: scoreEntry.accountID }) == undefined) await coll.insertOne(scoreEntry);
                    else await coll.replaceOne({ accountID: scoreEntry.accountID }, scoreEntry);
                });
            }
        }
    }

    public static async removeAllEntries() {
        await Database.RunOnCollection(Database.SCOREBOARD, async (coll) => {
            coll.deleteMany({});
        });
    }

    public static async removeAccountEntry(session: IAppSession) {
        let account: IAccount = await AccountManager.getAccount(session);
        await Database.RunOnCollection(Database.SCOREBOARD, async (coll) => {
            coll.deleteOne({ accountId: AccountManager.getAccountId(account.username) });
        });
    }

    public static async getEntries(type: QuizType): Promise<IScoreBoardEntry[]> {
        return await Database.GetDocuments(Database.SCOREBOARD, { type: type });
    }

    public static sort(entries: IScoreBoardEntry[]) {
        return entries.sort((a, b) => a.score > b.score ? -1 : (a.score == b.score ? (a.time > b.time ? 1 : (a.time == b.time ? 0 : -1)) : 1));
    }
}

export interface IScoreBoardEntry {
    accountID?: ObjectId;
    name: string;
    score: number;
    time: number;
    type: QuizType;
}