import { Session } from "express-session";
import { IAppSession, SessionManager } from "./sessionmanager";

export class QuoteRate {
    public static addFavorite(session: Session, QuoteId: string) {
        SessionManager.UpdateSessionData(session, async (data) => {
            if (!this.containsQuoteId(QuoteId, data.favorites)) data.favorites.push({ quoteId: QuoteId});
        });
    }

    public static addBlacklisted(session: Session, QuoteId: string, reason: string) {
        SessionManager.UpdateSessionData(session, (data) => {
            if (!this.containsQuoteId(QuoteId, data.blacklisted)) data.blacklisted.push({ quoteId: QuoteId, reason: reason });
        });
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