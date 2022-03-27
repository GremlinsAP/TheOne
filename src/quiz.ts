import { IQuestion, Util } from "./utils";
import { ICharacter, IMovie } from "./api";
import { AppSession, AppSessionData, SessionManager } from "./sessionmanager";

export class Quiz {

    private static readonly MAX_QUESTIONS = 15;

    private lastAnswers: [string, string] = ["", ""];
    private lastQuestionAsked?: IQuestion;

    private score: number = 0;
    private reviewQuestionIndex: number = 0;
    private questionIndex: number = 0;

    private passedQuestions: IQuestion[] = [];// Question -> Score
    private passedQuestionsReply: [string, string][] = [];

    // Set
    public SetLastQuestion = (question: IQuestion) => this.lastQuestionAsked = question;
    public AddScore = (score: number) => this.score += score;

    // Get
    public GetPassedQuestionsCount = (): number => this.passedQuestions.length;
    public GetScore = (): number => this.score;
    public GetPassedQuestions = (): IQuestion[] => this.passedQuestions;
    public GetLastQuestionAsked = (): IQuestion => this.lastQuestionAsked!;
    public IsFinished = (): boolean => this.passedQuestions.length == Quiz.MAX_QUESTIONS;

    constructor(quiz?: Quiz) {
        if (quiz) {
            this.lastAnswers = quiz.lastAnswers;
            this.lastQuestionAsked = quiz.lastQuestionAsked;
            this.score = quiz.score;
            this.reviewQuestionIndex = quiz.reviewQuestionIndex;
            this.passedQuestions = quiz.passedQuestions;
            this.passedQuestionsReply = quiz.passedQuestionsReply;
            this.questionIndex = quiz.questionIndex;
        }
    }

    private async WrapQuestionOutput(originalData: IQuizData): Promise<void> {
        if (this.GetLastQuestionAsked() == undefined) await this.CreateAndSetNewQuestion();

        let question: IQuestion = this.GetLastQuestionAsked();

        this.WrapQuestionDirect(originalData, question);

        this.questionIndex = this.passedQuestions.length;
        originalData.questionIndex = this.questionIndex;
        originalData.questionIndexMax = Quiz.MAX_QUESTIONS;
    }

    private WrapQuestionDirect(originalData: IQuizData, question: IQuestion): void {
        originalData.question = question.Dialog;
        let combined: (IMovie | ICharacter)[] = [];
        originalData.quoteId = question.QuoteId;
        combined = combined.concat(question.BadAnswers, question.CorrectAnswers);
        originalData.possibleCharacters = combined.filter((v: any, i, a) => 'hair' in v) as ICharacter[]
        originalData.possibleMovies = combined.filter((v: any, i, a) => !originalData.possibleCharacters?.includes(v)) as IMovie[];

        Util.INSTANCE.shuffle(originalData.possibleCharacters, Math.floor((Math.random() * 7) + 3));
        Util.INSTANCE.shuffle(originalData.possibleMovies, Math.floor((Math.random() * 7) + 3));
    }

    private GetPassedQuestionFromIndex(index: number): IQuestion {
        return this.passedQuestions[index]!;
    }

    private async WrapScoreBoardOutput(originalData: IQuizReview): Promise<void> {
        originalData.answeredQuestionsSize = this.GetPassedQuestions().length;
    }

    private async NextQuestionAndSaveOld(): Promise<void> {
        this.passedQuestions.push(this.GetLastQuestionAsked());
        if (!this.IsFinished()) await this.CreateAndSetNewQuestion();
        else this.reviewQuestionIndex = 0;
    }

    private async CreateAndSetNewQuestion(): Promise<void> {
        let question: IQuestion = await Util.INSTANCE.QuestionGenerator();
        this.SetLastQuestion(question);
    }

    // TODO This shouldn't even exist, prevent double POST
    private HasActuallyAnswered(movie: string | undefined, character: string | undefined): boolean {
        return this.lastAnswers[0] != movie || this.lastAnswers[1] != character;
    }

    private ProcessAnswer(dataBody: any, session: AppSession) {
        if (this.HasActuallyAnswered(dataBody.movie, dataBody.character)) {
            this.lastAnswers = [dataBody.movie, dataBody.character];
            this.passedQuestionsReply[this.passedQuestionsReply.length] = this.lastAnswers;
            let lastQuestion: IQuestion = this.GetLastQuestionAsked();

            const score = lastQuestion.CorrectAnswers.filter(t => t.name == dataBody.movie || t.name == dataBody.character).length * 0.5;
            this.AddScore(score);
            this.NextQuestionAndSaveOld();
            SessionManager.UpdateSessionData(session, app => app.quiz = this);
        }
    }

    // Static

    private static GetQuizForSession(session: AppSession): Quiz {
        let data: AppSessionData = SessionManager.GetDataFromSession(session);
        if (data.quiz != undefined) data.quiz = new Quiz(data.quiz);
        return data.quiz!;
    }

    private static CreateQuizForSession(session: AppSession): Quiz {
        SessionManager.UpdateSessionData(session, app => app.quiz = new Quiz());
        return session.data.quiz!;
    }

    private static DestroyQuizForSession(session: AppSession): Quiz {
        SessionManager.UpdateSessionData(session, app => app.quiz = undefined);
        return undefined!;
    }

    // Page Handling 
    public static async Process(req: any, res: any): Promise<IQuizData> {
        return this.Common(req, res);
    }

    private static async Common(req: any, res: any): Promise<IQuizData> {
        let session: AppSession = req.session;
        let dataBody: any = req.body;
        let quiz: Quiz = this.GetQuizForSession(session);

        if (!quiz && dataBody.startQuiz) quiz = this.CreateQuizForSession(session);
        if (dataBody.reset) quiz = this.DestroyQuizForSession(session);
        if ((dataBody.movie != undefined || dataBody.character != undefined) && quiz != undefined) quiz.ProcessAnswer(dataBody, session);

        let outData: IQuizData = {
            title: "Quiz",
            quizState: quiz != undefined ? (quiz.IsFinished() ? "done" : "active") : "begin"
        };

        switch (outData.quizState) {
            case "active":
                await quiz.WrapQuestionOutput(outData);
                outData.score = quiz.GetScore();
                break;

            case "done":
                if (dataBody.prevQuestion != undefined) {
                    if (quiz.reviewQuestionIndex - 1 >= 0) quiz.reviewQuestionIndex--;
                } else if (dataBody.nextQuestion != undefined) {
                    if (quiz.reviewQuestionIndex + 1 < quiz.GetPassedQuestions().length) quiz.reviewQuestionIndex++;
                }

                outData.score = quiz.GetScore();
                outData.questionIndex = quiz.reviewQuestionIndex;
                outData.questionIndexMax = Quiz.MAX_QUESTIONS;

                outData.quizReview = { userAnswers: quiz.passedQuestionsReply[outData.questionIndex] }
                let quizReviewData = outData.quizReview;

                let question = quiz.GetPassedQuestionFromIndex(outData.questionIndex);

                quizReviewData.correctAnswers = question.CorrectAnswers;

                quiz.WrapQuestionDirect(outData, question);
                quiz.WrapScoreBoardOutput(quizReviewData);
                break;
        }


        return outData;
    }
}

export interface IQuizData {
    title: string;
    quizState: string;

    questionIndex?: number;
    questionIndexMax?: number;

    score?: number;
    quoteId?: string;
    question?: string;

    possibleMovies?: IMovie[];
    possibleCharacters?: ICharacter[];

    quizReview?: IQuizReview;

}

export interface IQuizReview {
    correctAnswers?: (IMovie | ICharacter)[];
    answeredQuestionsSize?: number;
    userAnswers: [string, string]
}