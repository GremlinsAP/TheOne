import { IQuestion, Util } from "./utils";
import { ICharacter, IMovie } from "./api";
import { AppSession, AppSessionData, SessionManager } from "./sessionmanager";

export class Quiz {

    private static readonly MAX_QUESTIONS = 15;

    private currentAnswer: [string, string] = ["", ""];
    private currentQuestion?: IQuestion;

    private score: number = 0;
    private questionIndex: number = 0;

    private passedQuestions: IQuestion[] = [];// Question -> Score
    private passedQuestionsReply: [string, string][] = [];

    // Set
    private SetCurrentQuestion = (question: IQuestion) => this.currentQuestion = question;
    private AddScore = (score: number) => this.score += score;

    // Get
    private GetPassedQuestionsCount = (): number => this.passedQuestions.length;
    private GetScore = (): number => this.score;
    private GetPassedQuestions = (): IQuestion[] => this.passedQuestions;
    private GetCurrentQuestion = (): IQuestion => this.currentQuestion!;
    private IsFinished = (): boolean => this.passedQuestions.length == Quiz.MAX_QUESTIONS;

    constructor(quiz?: Quiz) {
        if (quiz) {
            this.currentAnswer = quiz.currentAnswer;
            this.currentQuestion = quiz.currentQuestion;
            this.score = quiz.score;
            this.questionIndex = quiz.questionIndex;
            this.passedQuestions = quiz.passedQuestions;
            this.passedQuestionsReply = quiz.passedQuestionsReply;
            this.questionIndex = quiz.questionIndex;
        }
    }

    private SetIndexToOutput(originalData: IQuizData, questionIndex: number): void {
        originalData.questionIndex = questionIndex;
        originalData.questionIndexMax = Quiz.MAX_QUESTIONS;
    }

    private AssignQuestionToOutput(originalData: IQuizData, question: IQuestion): void {
        originalData.question = question.Dialog;
        originalData.quoteId = question.QuoteId;

        let combined: (IMovie | ICharacter)[] = [];
        combined = combined.concat(question.BadAnswers, question.CorrectAnswers);

        originalData.possibleCharacters = combined.filter((v: any, i, a) => 'hair' in v) as ICharacter[]
        originalData.possibleMovies = combined.filter((v: any, i, a) => !originalData.possibleCharacters?.includes(v)) as IMovie[];

        Util.INSTANCE.shuffle(originalData.possibleCharacters, Math.floor((Math.random() * 7) + 3));
        Util.INSTANCE.shuffle(originalData.possibleMovies, Math.floor((Math.random() * 7) + 3));
    }

    private GetPassedQuestionFromIndex(index: number): IQuestion {
        return this.passedQuestions[index]!;
    }

    private WrapScoreBoardOutput(originalData: IQuizReview): void {
        originalData.answeredQuestionsSize = this.GetPassedQuestions().length;
    }

    private SaveToPassedQuestions(question: IQuestion): void {
        this.passedQuestions.push(question);
    }

    private async CreateQuestion(): Promise<IQuestion> {
        return await Util.INSTANCE.QuestionGenerator();
    }

    // TODO This shouldn't even exist, prevent double POST
    private HasActuallyAnswered(movie: string | undefined, character: string | undefined): boolean {
        return this.currentAnswer[0] != movie || this.currentAnswer[1] != character;
    }

    private ProcessAnswer(dataBody: IBodyData, question: IQuestion, session: AppSession): boolean {
        if (this.HasActuallyAnswered(dataBody.movie, dataBody.character)) {

            // Save reply from user
            this.currentAnswer = [dataBody.movie, dataBody.character];
            this.passedQuestionsReply[this.passedQuestionsReply.length] = this.currentAnswer;

            // Calculate score
            const score = question.CorrectAnswers.filter(t => t.name == dataBody.movie || t.name == dataBody.character).length * 0.5;
            this.AddScore(score);

            this.SaveToPassedQuestions(question);
            SessionManager.UpdateSessionData(session, app => app.quiz = this);
            return true;
        }

        return false;
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
        let dataBody: IBodyData = req.body;
        let quiz: Quiz = this.GetQuizForSession(session);

        // Start Quiz if none exists & button is pressed
        if (!quiz && dataBody.startQuiz) {
            quiz = this.CreateQuizForSession(session);
        }

        // Reset the quiz to an unset phase when button is pressed
        if (dataBody.reset) {
            quiz = this.DestroyQuizForSession(session);
        }

        let isLastQuestionAnswered: boolean = false;
        // Process the answers from the user
        if (dataBody.movie && dataBody.character && quiz != undefined) {
            isLastQuestionAnswered = quiz.ProcessAnswer(dataBody, quiz.GetCurrentQuestion(), session);
        }

        // Data for output
        let outData: IQuizData = {
            title: "Quiz",
            quizState: quiz != undefined ? (quiz.IsFinished() ? "done" : "active") : "begin"
        };

        switch (outData.quizState) {
            case "active":

                // Set the first question
                if (!quiz.currentQuestion || isLastQuestionAnswered) {
                    quiz.SetCurrentQuestion(await quiz.CreateQuestion());
                }

                quiz.SetIndexToOutput(outData, quiz.GetPassedQuestionsCount());
                quiz.AssignQuestionToOutput(outData, quiz.GetCurrentQuestion());
                break;

            case "done":

                // Cycle between reviews    
                if (dataBody.prevQuestion || dataBody.nextQuestion) {
                    quiz.questionIndex = Util.INSTANCE.AssureMoveBetween(quiz.questionIndex, 0, quiz.GetPassedQuestions().length - 1, (n) => {
                        return dataBody.prevQuestion ? n - 1 : dataBody.nextQuestion ? n + 1 : n;
                    });
                }

                outData.score = quiz.GetScore();
                quiz.SetIndexToOutput(outData, quiz.questionIndex);

                outData.quizReview = { userAnswers: quiz.passedQuestionsReply[outData.questionIndex!] }
                let quizReviewData = outData.quizReview;

                let question = quiz.GetPassedQuestionFromIndex(outData.questionIndex!);
                quizReviewData.correctAnswers = question.CorrectAnswers;

                quiz.AssignQuestionToOutput(outData, question);
                quiz.WrapScoreBoardOutput(quizReviewData);
                break;
        }


        return outData;
    }
}

export interface IBodyData {
    startQuiz?: string;
    reset?: string;
    prevQuestion?: string;
    nextQuestion?: string;

    movie: string;
    character: string;
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