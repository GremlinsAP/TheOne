import { Collection, ObjectId, WithId } from "mongodb";
import { Database } from "./database";
import { Session, SessionData } from "express-session"
import { Quiz } from "./quiz";

export class SessionManager {

    public static sessions: Map<string, AppSessionData> = new Map<string, AppSessionData>();

    public static setup() {
        this.runUpdateLoop();
    }

    public static async createSession(session: Session): Promise<void> {
        if (!await this.hasSession(session)) {
            let newSessionData: AppSessionData = { id: session.id }
            await Database.runOnCollection(Database.SESSIONS, async coll => await coll.insertOne(newSessionData));
        }

        if (!this.sessions.has(session.id)) this.sessions.set(session.id, await this.getDataFromSession(session));
    }

    public static async hasSession(session: Session): Promise<boolean> {
        return this.sessions.has(session.id) || await Database.runOnCollection(Database.SESSIONS, async coll => await coll.findOne({ id: session.id })) != null;
    }

    public static async getDataFromSession(session: Session): Promise<AppSessionData> {
        if (!this.sessions.has(session.id)) {
            if (await this.hasSession(session)) {
                const document: AppSessionData = await Database.getDocument(Database.SESSIONS, { id: session.id });
                if (document != null) {
                    if (document.quiz != undefined) {
                        let tempQuiz = new Quiz();
                        tempQuiz.setup(document.quiz);
                        document.quiz = tempQuiz;
                    }

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

    public static hasUpdate: string[] = [];
    public static async runUpdateLoop() {
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

    public static async wipeSessions(): Promise<void> {
        await Database.runOnCollection(Database.SESSIONS, async coll => coll.deleteMany({}));
    }
}

export interface AppSessionData {
    id: string;
    quiz?: Quiz;
} 