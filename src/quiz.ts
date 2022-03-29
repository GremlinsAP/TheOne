import { IQuestion, Util } from "./utils";
import { ICharacter, IMovie } from "./api";
import { AppSession, AppSessionData, SessionManager } from "./sessionmanager";
import { Request, Response } from "express";

export class Quiz {

    private static readonly MAX_QUESTIONS = 15;

    private questions: IQuestionWithoutAnswer[] = [];
    private questionAnswers: [string, string][] = []; // [movieId, characterId]

    private passedQuestions: IQuestionWithoutAnswer[] = [];
    private passedQuestionReplies: [string, string][] = [];

    private score: number = 0;
    private questionIndex: number = 0;
    private questionIndexMax: number = Quiz.MAX_QUESTIONS;

    constructor(quiz?: Quiz) {
        if (quiz) {
            this.questions = quiz.questions;
            this.score = quiz.score;
            this.questionIndexMax = quiz.questionIndexMax;
            this.questionIndex = quiz.questionIndex;
            this.passedQuestions = quiz.passedQuestions;
            this.passedQuestionReplies = quiz.passedQuestionReplies;
            this.questionAnswers = quiz.questionAnswers;
        }
    }

    // Set
    private AddScore = (score: number) => this.score += score;
    private SetIndexToOutput = (outData: IQuizData, index: number) => outData.questionIndex = index;

    // Get
    private GetQuestions = (): IQuestionWithoutAnswer[] => this.questions;
    private GetAnswerForQuestion = (question: IQuestionWithoutAnswer): [string, string] => this.questionAnswers[this.GetQuestions().indexOf(question)];

    private GetPassedQuestionsCount = (): number => this.passedQuestions.length;
    private GetScore = (): number => this.score;
    private GetPassedQuestions = (): IQuestionWithoutAnswer[] => this.passedQuestions;

    // Other
    private IsFinished = (): boolean => this.passedQuestions.length == Quiz.MAX_QUESTIONS;

    private IncrementQuestionIndex(): void {
        this.questionIndex++;
    };

    private SaveToPassedQuestions(question: IQuestionWithoutAnswer): void {
        this.passedQuestions.push(question);
    }

    private SaveToPassedQuestionReplies(answer: [string, string]): void {
        this.passedQuestionReplies.push(answer);
    }

    private async CreateQuestion(): Promise<IQuestion> {
        return await Util.INSTANCE.QuestionGenerator();
    }

    private async CreateQuestions() {
        for (let x = 0; x < Quiz.MAX_QUESTIONS; x++) {
            let question: IQuestion;

            do {
                question = await this.CreateQuestion();
            } while (this.questions.find(q => question.QuoteId == q.QuoteId));

            this.questions.push(this.ProcessQuestion(question));
            this.questionAnswers.push([question.CorrectAnswers[0]._id, question.CorrectAnswers[1]._id]);
        }
    }

    private ProcessQuestion(question: IQuestion): IQuestionWithoutAnswer {
        let processedQuestion: IQuestionWithoutAnswer = {
            Dialog: question.Dialog,
            QuoteId: question.QuoteId,
            possibleCharacters: [],
            possibleMovies: [],
            hasBeenAnswered: false
        }

        let combined: (IMovie | ICharacter)[] = [];
        combined = combined.concat(question.BadAnswers, question.CorrectAnswers);

        processedQuestion.possibleCharacters = combined.filter((v: any, i, a) => 'hair' in v) as ICharacter[]
        processedQuestion.possibleMovies = combined.filter((v: any, i, a) => !processedQuestion.possibleCharacters?.includes(v)) as IMovie[];

        Util.INSTANCE.shuffle(processedQuestion.possibleCharacters, Math.floor((Math.random() * 7) + 3));
        Util.INSTANCE.shuffle(processedQuestion.possibleMovies, Math.floor((Math.random() * 7) + 3));

        return processedQuestion;
    }

    private setQuestionAnswered(question: IQuestionWithoutAnswer) {
        question.hasBeenAnswered = true;
    }

    private ProcessAnswer(dataBody: IUserAnswer, question: IQuestionWithoutAnswer, answers: [string, string], session: AppSession) {
        let reply: [string, string] = [dataBody.character, dataBody.movie];

        // Save reply from user
        this.SaveToPassedQuestionReplies(reply);

        // Calculate score
        const score = answers.filter(t => t == reply[0] || t == reply[1]).length * 0.5;
        this.AddScore(score);

        this.setQuestionAnswered(question);
        this.SaveToPassedQuestions(question);
        SessionManager.UpdateSessionData(session, app => app.quiz = this);
    }

    // Static
    private static GetQuizForSession(session: AppSession): Quiz {
        let data: AppSessionData = SessionManager.GetDataFromSession(session);
        if (data.quiz != undefined) data.quiz = new Quiz(data.quiz);
        return data.quiz!;
    }

    private static CreateQuizForSession(session: AppSession): Quiz {
        SessionManager.UpdateSessionData(session, app => app.quiz = new Quiz());
        return session.data!.quiz!;
    }

    private static DestroyQuizForSession(session: AppSession): Quiz {
        SessionManager.UpdateSessionData(session, app => app.quiz = undefined);
        return undefined!;
    }

    private static GetQuizState = (quiz: Quiz) => quiz == undefined ? "begin" : (quiz.IsFinished() ? "review" : "active");

    public static async handleQuizPost(req: Request, res: Response) {
        let session: AppSession = req.session;
        let quiz: Quiz = this.GetQuizForSession(session);
        let quizState: string = this.GetQuizState(quiz);
        let bodyData: IBodyData = req.body;

        // Start Quiz if none exists & button is pressed
        if (!quiz && bodyData.startQuiz) {
            quiz = this.CreateQuizForSession(session);
            await quiz.CreateQuestions();
        }

        if (quizState != "begin") {
            // Reset the quiz to an unset phase when button is pressed
            if (quiz && quiz && bodyData.reset) {
                quiz = this.DestroyQuizForSession(session);
            }
        }

        if (quizState == "active") {
            // User answered a question
            if (bodyData.userAnswer) {
                let question: IQuestionWithoutAnswer = quiz.GetQuestions()[quiz.questionIndex];
                quiz.ProcessAnswer(bodyData.userAnswer, question, quiz.GetAnswerForQuestion(question), session)
                quiz.IncrementQuestionIndex();
                if (quiz.IsFinished()) quiz.questionIndex = 0;
            }
        }

        if (quizState == "review") {
            if (bodyData.navigator) {
                let nav = bodyData.navigator;
                quiz.questionIndex = Util.INSTANCE.AssureMoveBetween(quiz.questionIndex, 0, quiz.GetPassedQuestions().length - 1, (n) => {
                    return nav.previous ? n - 1 : nav.next ? n + 1 : n;
                });
            }
        }
    }

    public static CompileQuizData(req: Request, res: Response): IQuizData {
        let session: AppSession = req.session;
        let quiz: Quiz = this.GetQuizForSession(session);

        let outData: IQuizData = {
            quizState: this.GetQuizState(quiz),
        };

        switch (outData.quizState) {
            case "begin": break;
            case "active":
                outData.questionIndexMax = quiz.questionIndexMax;
                outData.questionIndex = quiz.GetPassedQuestionsCount();
                outData.questions = quiz.GetQuestions();
                break;
            case "review":
                quiz.SetIndexToOutput(outData, quiz.questionIndex);
                outData.questionIndexMax = quiz.questionIndexMax;
                outData.questions = quiz.GetQuestions();
                outData.reviewData = {
                    score: quiz.GetScore(),
                    userAnswers: quiz.passedQuestionReplies,
                    correctAnswers: quiz.questionAnswers
                };
                break;
        }

        return outData;
    }
}

export interface IBodyData {
    startQuiz?: boolean;
    reset?: boolean;

    userAnswer?: IUserAnswer;

    navigator: { next?: boolean, previous?: boolean };
}

export interface IUserAnswer {
    movie: string;
    character: string;
}

export interface IQuestionWithoutAnswer {
    QuoteId: string;
    Dialog: string;
    possibleMovies: IMovie[];
    possibleCharacters: ICharacter[];
    hasBeenAnswered: boolean;
}

export interface IQuizData {
    quizState: string;
    questionIndexMax?: number;

    questionIndex?: number;
    questions?: IQuestionWithoutAnswer[];

    reviewData?: IQuizReviewData;
}

export interface IQuizReviewData {
    score: number;
    userAnswers: [string, string][];
    correctAnswers: [string, string][];
} 
