import { Session } from "express-session";
import { IQuoteRate, SessionManager } from "./sessionmanager";

export class QuoteRate {
    public static addFavorite(session: Session, QuoteId: string, reason: string) {
        SessionManager.UpdateSessionData(session, (data) => {
            if (!this.containsQuoteId(QuoteId, data.favorites)) data.favorites.push({ quoteId: QuoteId, reason: reason });
        });
    }

    public static addBlacklisted(session: Session, QuoteId: string, reason: string) {
        SessionManager.UpdateSessionData(session, (data) => {
            if (!this.containsQuoteId(QuoteId, data.blacklisted)) data.blacklisted.push({ quoteId: QuoteId, reason: reason });
        });
    }

    public static editFavorite(session: Session, QuoteId: string, reason: string) {
        SessionManager.UpdateSessionData(session, (data) => {
            if (this.containsQuoteId(QuoteId, data.favorites)) data.favorites.find(rate => rate.quoteId = QuoteId)!.reason = "";
        });
    }

    public static editBlacklisted(session: Session, QuoteId: string, reason: string) {
        SessionManager.UpdateSessionData(session, (data) => {
            if (this.containsQuoteId(QuoteId, data.blacklisted)) data.blacklisted.find(rate => rate.quoteId = QuoteId)!.reason = "";
        });
    }

    public static removeFavorite(session: Session, QuoteId: string) {
        SessionManager.UpdateSessionData(session, (data) => {
            data.favorites = data.favorites.filter(rate => rate.quoteId != QuoteId);
        });
    }

    public static removeBlacklisted(session: Session, QuoteId: string) {
        SessionManager.UpdateSessionData(session, (data) => {
            data.blacklisted = data.blacklisted.filter(rate => rate.quoteId != QuoteId); 
        });
    }

    private static containsQuoteId = (quoteId: string, quoteRateList: IQuoteRate[]): boolean => quoteRateList.some(rate => rate.quoteId == quoteId);
}