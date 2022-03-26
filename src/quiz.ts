import { IQuestion, Util } from "./utils";
import { ICharacter, IMovie } from "./api";

export class Quiz {

    public static tempINSTANCE: Quiz | undefined;
    private static readonly maxQuestions = 1;

    private score: number = 0;

    private lastAnswers: [string, string] = ["", ""];
    private passedQuestions: Map<IQuestion, number> = new Map(); // Question -> Score
    private lastQuestionAsked?: IQuestion;

    // Set
    public setLastQuestion = (question: IQuestion) => this.lastQuestionAsked = question;
    public addScore = (score: number) => this.score += score;

    // Get
    public getPassedQuestionsCount = (): number => this.passedQuestions.size;
    public getScore = (): number => this.score;
    public getPassedQuestions = (): Map<IQuestion, number> => this.passedQuestions;
    public getLastQuestionAsked = (): IQuestion => this.lastQuestionAsked!;
    public isFinished = (): boolean => this.passedQuestions.size == Quiz.maxQuestions;

    private async wrapQuestionOutput(originalData: QuizData): Promise<void> {
        if (this.getLastQuestionAsked() == undefined) await this.createAndSetNewQuestion();

        let question: IQuestion = this.getLastQuestionAsked();

        originalData.question = question.Dialog;

        let combined: (IMovie | ICharacter)[] = [];
        combined = combined.concat(question.BadAnswers, question.CorrectAnswers);
        originalData.possibleCharacters = combined.filter((v: any, i, a) => v.hair != undefined) as ICharacter[]
        originalData.possibleMovies = combined.filter((v: any, i, a) => !originalData.possibleCharacters?.includes(v)) as IMovie[];

        originalData.questionIndex = this.getPassedQuestions().size + 1;
        originalData.questionIndexMax = Quiz.maxQuestions;

        Util.INSTANCE.shuffle(originalData.possibleCharacters, Math.floor((Math.random() * 15) + 3));
        Util.INSTANCE.shuffle(originalData.possibleMovies, Math.floor((Math.random() * 15) + 3));
    }

    private async wrapScoreBoardOutput(originalData: QuizData): Promise<void> {
        originalData.answeredQuestionsMap = this.getPassedQuestions();
    }

    private async nextQuestionAndSaveOld(score: number): Promise<void> {
        this.passedQuestions.set(this.getLastQuestionAsked(), score)
        await this.createAndSetNewQuestion();
    }

    private async createAndSetNewQuestion(): Promise<void> {
        let question: IQuestion = await Util.INSTANCE.QuestionGenerator();
        this.setLastQuestion(question);
    }

    private hasActuallyAnswered(movie: string | undefined, character: string | undefined): boolean {
        return this.lastAnswers[0] != movie || this.lastAnswers[1] != character;
    }

    // Static

    public static getQuizForSession(sessionId: string): Quiz {
        return this.tempINSTANCE!;
    }

    public static createQuizForSession(sessionId: string): Quiz {
        return this.tempINSTANCE!;
    }

    // Page Handling 
    public static post(sessionId: string, req: any, res: any) {
        this.common(sessionId, req, res);
    }

    public static get(sessionId: string, req: any, res: any) {
        this.common(sessionId, req, res);
    }

    private static async common(sessionId: string, req: any, res: any) {
        let dataBody: any = req.body;
        let quiz: Quiz = this.getQuizForSession(sessionId);
        if (!quiz) {
            if (dataBody.startQuiz) {
                Quiz.tempINSTANCE = new Quiz();
                quiz = Quiz.tempINSTANCE;
            }
        }

        if (dataBody.reset) {
            Quiz.tempINSTANCE = undefined;
            quiz = this.getQuizForSession(sessionId);
        }

        if ((dataBody.movie != undefined || dataBody.character != undefined) && quiz != undefined && quiz.hasActuallyAnswered(dataBody.movie, dataBody.character)) {
            quiz.lastAnswers = [dataBody.movie, dataBody.character];
            let lastQuestion: IQuestion = quiz.getLastQuestionAsked();

            const score = lastQuestion.CorrectAnswers.filter(t => t.name == dataBody.movie || t.name == dataBody.character).length * 0.5;
            quiz.addScore(score);
            await quiz.nextQuestionAndSaveOld(score);
        }

        let outData: QuizData = {
            title: "Quiz",
            quizState: quiz != undefined ? (quiz.isFinished() ? "done" : "active") : "begin"
        };

        switch (outData.quizState) {
            case "active":
                await quiz.wrapQuestionOutput(outData);
                outData.score = quiz.getScore();
                break;
            case "done":
                outData.score = quiz.getScore();
                quiz.wrapScoreBoardOutput(outData);
                break;
        }

        res.render(`quiz-${outData.quizState}`, outData);
    }
}

export interface QuizData {
    title: string;
    quizState: string;

    questionIndex?:number;
    questionIndexMax?:number;

    score?: number;
    question?: string;
    possibleMovies?: IMovie[];
    possibleCharacters?: ICharacter[];

    answeredQuestionsMap?: Map<IQuestion, number>;
}