import { IQuestion, Util } from "./utils";
import { ICharacter, IMovie } from "./api";

export class Quiz {

    public static tempINSTANCE: Quiz;
    private static readonly maxQuestions = 20;

    private score: number = 0;

    private passedQuestions: IQuestion[] = [];
    private lastQuestionAsked?: IQuestion;

    // Set
    public setLastQuestion = (question: IQuestion) => this.lastQuestionAsked = question;
    public addScore = (score: number) => this.score += score;

    // Get
    public getPassedQuestionsCount = (): number => this.passedQuestions.length;
    public getScore = (): number => this.score;
    public getPassedQuestions = (): IQuestion[] => this.passedQuestions;
    public getLastQuestionAsked = (): IQuestion => this.lastQuestionAsked!;
    public isFinished = (): boolean => this.passedQuestions.length == Quiz.maxQuestions;

    private async wrapQuestionOutput(originalData: QuizData): Promise<void> {
        if (this.getLastQuestionAsked() == undefined) await this.createAndSetNewQuestion();

        let question: IQuestion = this.getLastQuestionAsked();

        originalData.question = question.Dialog;

        let combined: (IMovie | ICharacter)[] = [];
        combined = combined.concat(question.BadAnswers, question.CorrectAnswers);
        originalData.possibleCharacters = combined.filter((v: any, i, a) => v.hair != undefined) as ICharacter[]
        originalData.possibleMovies = combined.filter((v: any, i, a) => !originalData.possibleCharacters?.includes(v)) as IMovie[];

        Util.INSTANCE.shuffle(originalData.possibleCharacters, 15);
        Util.INSTANCE.shuffle(originalData.possibleMovies, 15);
    }

    private async nextQuestionAndSaveOld(): Promise<void> {
        this.passedQuestions[this.passedQuestions.length] = this.getLastQuestionAsked();
        await this.createAndSetNewQuestion();
    }

    private async createAndSetNewQuestion(): Promise<void> {
        let question: IQuestion = await Util.INSTANCE.QuestionGenerator();
        this.setLastQuestion(question);
    }

    // Static

    public static getQuizForSession(sessionId: string): Quiz {
        return this.tempINSTANCE;
    }

    public static createQuizForSession(sessionId: string): Quiz {
        return this.tempINSTANCE;
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
            if (dataBody.startQuiz === 'true') {
                Quiz.tempINSTANCE = new Quiz();
                quiz = Quiz.tempINSTANCE;
            }
        }

        if (dataBody.movie != undefined || dataBody.character != undefined) {
            let lastQuestion: IQuestion = quiz.getLastQuestionAsked();
            quiz.addScore(lastQuestion.CorrectAnswers.filter(t => t.name == dataBody.movie || t.name == dataBody.character).length * 0.5);
            await quiz.nextQuestionAndSaveOld();
        }

        let outData: QuizData = {
            title: "Quiz",
            doingQuiz: quiz != undefined
        };

        if (outData.doingQuiz) {
            await quiz.wrapQuestionOutput(outData);
            outData.score = quiz.score;
        }

        res.render("quiz", outData);
    }
}

export interface QuizData {
    title: string;
    doingQuiz: boolean;
    score?: number;
    question?: string;
    possibleMovies?: IMovie[];
    possibleCharacters?: ICharacter[];
}  