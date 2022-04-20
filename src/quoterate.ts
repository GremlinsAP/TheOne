import { Session } from "express-session";
import { IAppSession, IAppSessionData, SessionManager } from "./sessionmanager";

export class QuoteRate {
    public static addFavorite(session: Session, QuoteId: string) {
        SessionManager.UpdateSessionData(session, async (data) => {
            if (!this.containsQuoteId(QuoteId, data.favorites)) data.favorites.push({ quoteId: QuoteId });
        });
    }

    public static isFavorite(session:Session, quoteId: string) {
        let data:IAppSessionData = SessionManager.GetDataFromSession(session);
        return data.favorites.findIndex(i => i.quoteId == quoteId) != -1;
     }

    public static addBlacklisted(session: Session, QuoteId: string, reason: string) {
        SessionManager.UpdateSessionData(session, (data) => {
            if (!this.containsQuoteId(QuoteId, data.blacklisted)) data.blacklisted.push({ quoteId: QuoteId, reason: reason });
        });
    }

    public static isBlacklisted(session:Session, quoteId: string) {
       let data:IAppSessionData = SessionManager.GetDataFromSession(session);
       return data.blacklisted.findIndex(i => i.quoteId == quoteId) != -1;
    }

    public static editBlacklisted(session: Session, QuoteId: string, reason: string) {
        SessionManager.UpdateSessionData(session, (data) => {
            if (this.containsQuoteId(QuoteId, data.blacklisted)) data.blacklisted.find(rate => rate.quoteId = QuoteId)!.reason = reason;
        });
    }

    public static removeFavorite(session: Session, QuoteId: string) {
        SessionManager.UpdateSessionData(session, (data) => {
            data.favorites = data.favorites.filter(rate => rate.quoteId != QuoteId);
        });
    }

    public static removeBlacklisted(session: IAppSession, QuoteId: string) {
        SessionManager.UpdateSessionData(session, (data) => {
            data.blacklisted = data.blacklisted.filter(rate => rate.quoteId != QuoteId);
        });
    }

    private static containsQuoteId = (quoteId: string, quoteRateList: IQuoteRate[]): boolean => quoteRateList.some(rate => rate.quoteId == quoteId);
}

export interface IQuoteRate {
    quoteId: string;
    reason?: string;
}