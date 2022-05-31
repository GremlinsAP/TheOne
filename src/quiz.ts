import { IQuestion, Util } from "./utils";
import { ICharacter, IMovie } from "./api";
import { IAppSession, IAppSessionData, SessionManager } from "./sessionmanager";
import { Request, Response } from "express";
import { Session } from "express-session";
import { Scoreboard } from "./scoreboard";

export class Quiz {
    public quizType: QuizType = QuizType.SUDDENDEATH;

    private startTime = Date.now();
    public finishedTime = 0;

    private questions: IQuestionWrapped[] = [];
    private questionAnswers: [string, string][] = []; // [movieId, characterId]

    private passedQuestionReplies: [string, string][] = [];

    private score: number = 0;
    private questionIndex: number = 0;
    private questionIndexMax: number = 10;

    private isDone: boolean = false;

    constructor(quiz?: Quiz) {
        if (quiz) {
            this.quizType = quiz.quizType;
            this.questions = quiz.questions;
            this.score = quiz.score;
            this.questionIndexMax = quiz.questionIndexMax;
            this.questionIndex = quiz.questionIndex;
            this.passedQuestionReplies = quiz.passedQuestionReplies;
            this.questionAnswers = quiz.questionAnswers;
            this.isDone = quiz.isDone;
            this.startTime = quiz.startTime;
            this.finishedTime = quiz.finishedTime;
        }
    }

    // Set
    private AddScore = (score: number) => this.score += score;
    private SetIndexToOutput = (outData: IQuizData, index: number) => outData.questionIndex = index;
    private SetFinished = (finished: boolean) => this.isDone = finished;

    // Get
    private GetQuestions = (): IQuestionWrapped[] => this.questions;
    private GetAnswerForQuestion = (question: IQuestionWrapped): [string, string] => this.questionAnswers[this.GetQuestions().indexOf(question)];
    public GetPassedQuestionsCount = (): number => this.GetPassedQuestions().length;
    public GetScore = (): number => this.score;
    private GetPassedQuestions = (): IQuestionWrapped[] => this.questions.filter((q) => q.hasBeenAnswered);
    private ShouldBeDone = (madeAMistake: boolean = false) => this.quizType == QuizType.TEN ? this.GetPassedQuestionsCount() == this.questionIndexMax : madeAMistake

    // Other
    public IsFinished = (): boolean => this.isDone;

    private IncrementQuestionIndex(): void {
        this.questionIndex++;
    };

    private SaveToPassedQuestionReplies(answer: [string, string]): void {
        this.passedQuestionReplies.push(answer);
    }

    private async CreateQuestion(session: Session): Promise<IQuestion> {
        return await Util.INSTANCE.QuestionGenerator(session);
    }

    private async CreateNextQuestion(session: Session): Promise<IQuestionWrapped> {
        let question: IQuestion;

        do {
            question = await this.CreateQuestion(session);
        } while (this.questions.find(q => question.QuoteId == q.QuoteId || question.Dialog == q.Dialog));

        let wrappedQuestion: IQuestionWrapped = this.ProcessQuestion(question);

        this.questions.push(wrappedQuestion);
        this.questionAnswers.push([question.CorrectAnswers[0]._id, question.CorrectAnswers[1]._id]);

        return wrappedQuestion;
    }

    private ProcessQuestion(question: IQuestion): IQuestionWrapped {
        let processedQuestion: IQuestionWrapped = {
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

    private setQuestionAnswered(question: IQuestionWrapped) {
        question.hasBeenAnswered = true;
    }

    private setQuestionUserAnswer(question: IQuestionWrapped, userAnswer: [string, string]) {
        question.userAnswer = userAnswer;
    }

    private ProcessAnswer(dataBody: IUserAnswer, question: IQuestionWrapped, answers: [string, string], session: IAppSession) {
        if (dataBody.character == undefined || dataBody.movie == undefined) return false;
        if (question.hasBeenAnswered) return true;

        let reply: [string, string] = [dataBody.character, dataBody.movie];

        // Save reply from user
        this.SaveToPassedQuestionReplies(reply);

        // Calculate score
        const score = answers.filter(t => t == reply[0] || t == reply[1]).length * 0.5;
        this.AddScore(score);

        this.setQuestionAnswered(question);
        this.setQuestionUserAnswer(question, reply);

        // Set finished when the user didn't get it completely right on sudden death. 
        // On 10 questions it will end in the other gamemode
        this.SetFinished(this.ShouldBeDone(score < 1));
        SessionManager.UpdateSessionData(session, async app => { app.quiz = this });

        return true;
    }

    // Static
    private static GetQuizForSession(session: IAppSession): Quiz {
        let data: IAppSessionData = SessionManager.GetDataFromSession(session);
        if (data.quiz != undefined) data.quiz = new Quiz(data.quiz);
        return data.quiz!;
    }

    private static CreateQuizForSession(session: IAppSession): Quiz {
        SessionManager.UpdateSessionData(session, async app => { app.quiz = new Quiz() });
        return session.data!.quiz!;
    }

    private static DestroyQuizForSession(session: IAppSession): Quiz {
        SessionManager.UpdateSessionData(session, async app => { app.quiz = undefined });
        return undefined!;
    }

    private AssignAnswersToQuestions() {
        for (let x = 0; x < this.questions.length; x++) {
            let question: IQuestionWrapped = this.GetPassedQuestions()[x];
            question.correctAnswer = this.GetAnswerForQuestion(question);
        }
    }

    private static GetQuizState = (quiz: Quiz) => quiz == undefined ? "begin" : (quiz.IsFinished() ? "review" : "active");

    public static async handleQuizPost(req: Request, res: Response) {
        let session: IAppSession = req.session;
        let quiz: Quiz = this.GetQuizForSession(session);
        let quizState: string = this.GetQuizState(quiz);
        let bodyData: IBodyData = req.body;

        // Start Quiz if none exists & button is pressed
        if (!quiz && bodyData.startQuiz && bodyData.gamemode) {
            quiz = this.CreateQuizForSession(session);
            quiz.quizType = bodyData.gamemode == "ten" ? QuizType.TEN : QuizType.SUDDENDEATH;
        }

        if (quizState != "begin") {
            // Reset the quiz to an unset phase when button is pressed
            if (quiz && quiz && bodyData.reset) quiz = this.DestroyQuizForSession(session);
        }

        if (quizState == "active") {
            // User answered a question
            if (bodyData.userAnswer) {
                let question: IQuestionWrapped = quiz.GetQuestions()[quiz.questionIndex];

                if (question != undefined && quiz.ProcessAnswer(bodyData.userAnswer, question, quiz.GetAnswerForQuestion(question), session)) quiz.IncrementQuestionIndex();

                if (quiz.IsFinished()) {
                    quiz.questionIndex = 0;
                    quiz.AssignAnswersToQuestions();

                    quiz.finishedTime = Date.now() - quiz.startTime;
                    Scoreboard.addEntry(session, quiz.quizType, quiz.GetScore(), quiz.GetPassedQuestionsCount(), quiz.finishedTime);
                }
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

    public static async CompileQuizData(req: Request, res: Response): Promise<IQuizData> {
        let session: IAppSession = req.session;
        let quiz: Quiz = this.GetQuizForSession(session);

        let outData: IQuizData = { quizState: this.GetQuizState(quiz) };

        switch (outData.quizState) {
            case "begin": break;
            case "active":
                let currentQuestion = quiz.GetQuestions()[quiz.questionIndex];
                outData.questionIndexMax = quiz.questionIndexMax;
                outData.questionIndex = quiz.GetPassedQuestionsCount();
                outData.question = currentQuestion && !currentQuestion.hasBeenAnswered ? currentQuestion : await quiz.CreateNextQuestion(session);
                outData.quizType = quiz.quizType;
                break;
            case "review":
                outData.quizType = quiz.quizType;
                quiz.SetIndexToOutput(outData, quiz.questionIndex);
                outData.questionIndexMax = quiz.GetPassedQuestionsCount();
                outData.reviewData = { score: quiz.GetScore(), questions: quiz.GetQuestions() };
                break;
        }

        return outData;
    }
}

export enum QuizType {
    SUDDENDEATH = "suddendeath", TEN = "ten"
}

export interface IBodyData {
    startQuiz: boolean;
    reset: boolean;
    userAnswer: IUserAnswer;
    gamemode: string;
    navigator: { next?: boolean, previous?: boolean };
}

export interface IUserAnswer {
    movie: string;
    character: string;
}

export interface IQuestionWrapped {
    QuoteId: string;
    Dialog: string;
    possibleMovies: IMovie[];
    possibleCharacters: ICharacter[];
    hasBeenAnswered: boolean;
    userAnswer?: [string, string];
    correctAnswer?: [string, string];
}

export interface IQuizData {
    quizType?: QuizType;
    quizState: string;

    questionIndex?: number;
    questionIndexMax?: number;

    question?: IQuestionWrapped;

    reviewData?: IQuizReviewData;
}

export interface IQuizReviewData {
    score: number;
    questions: IQuestionWrapped[];
} 
