import { Database } from "./database";
import { Session } from "express-session"
import { Quiz } from "./quiz";

export class SessionManager {

    public static sessions: Map<string, AppSessionData> = new Map<string, AppSessionData>();

    public static setup() {
        this.wipeInvalidSessions();
        this.runUpdateLoop();
    }

    private static async createSession(session: Session): Promise<void> {
        if (!await this.hasSession(session)) {
            let newSessionData: AppSessionData = { id: session.id, exipires: session.cookie.expires }
            await Database.runOnCollection(Database.SESSIONS, async coll => await coll.insertOne(newSessionData));
        }

        if (!this.sessions.has(session.id)) this.sessions.set(session.id, await this.getDataFromSession(session));
    }

    private static async hasSession(session: Session): Promise<boolean> {
        return this.sessions.has(session.id) || await Database.runOnCollection(Database.SESSIONS, async coll => await coll.findOne({ id: session.id })) != null;
    }

    public static async getDataFromSession(session: Session): Promise<AppSessionData> {
        if (!this.sessions.has(session.id)) {
            if (await this.hasSession(session)) {
                const document: AppSessionData = await Database.getDocument(Database.SESSIONS, { id: session.id });
                if (document != null) {
                    if (document.quiz != undefined) document.quiz = new Quiz(document.quiz);
                    this.sessions.set(session.id, document);
                }
                return document;
            } else await this.createSession(session);
        }

        return this.sessions.get(session.id)!;
    }

    public static async updateSessionData(session: Session, callback: { (data: AppSessionData): void }): Promise<AppSessionData> {
        let data: AppSessionData;

        if (this.sessions.has(session.id)) {
            data = await this.getDataFromSession(session);
            callback(data);
            this.sessions.set(session.id, data);
            if (!this.hasUpdate.includes(session.id)) this.hasUpdate.push(session.id);
        };

        return data!;
    }

    private static hasUpdate: string[] = [];
    private static async runUpdateLoop() {
        setInterval(() => {
            if (this.hasUpdate.length > 0) {
                this.hasUpdate.forEach(async sessionId => {
                    setTimeout(async () => {
                        await Database.runOnCollection(Database.SESSIONS, async coll => coll.updateOne({ id: sessionId }, { $set: { quiz: this.sessions.get(sessionId)?.quiz } }));
                        this.hasUpdate.shift()
                    }, 500);
                });
            }
        }, 5000);
    }

    private static async wipeInvalidSessions(): Promise<void> {
        let date: Date = new Date();
        Database.runOnCollection(Database.SESSIONS, async coll => {
            let allData: AppSessionData[] = await Database.getDocuments(Database.SESSIONS, {});

            allData.forEach(async data => {
                if (data.exipires! < date) await Database.runOnCollection(Database.SESSIONS, async coll => coll.deleteOne({ expires: (data as any).expires }));
            });
        });
    }
}

export interface AppSessionData {
    id: string;
    quiz?: Quiz;
    exipires: Date | undefined;
} 