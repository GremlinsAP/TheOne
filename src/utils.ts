import fs from "fs";
import { Api, ICharacter, IMovie, IQuote } from "./api";
const QuotesPath: string = "./quotes.json";
const CharacterPath: string = "./characters.json";
const MoviePath: string = "./movies.json";
const BlacklistedPath: string = "./blacklisted.json";
const favouritePath: string = "./favourited.json";
/*
Quick guide voor question generator:
1. import class
2. defineer class object "let generator: Util = new Util();"
3. gebruik QuestionGenerator function (uses promises)
voorbeeld:
```
let Generator: Util = new Util();
Generator.QuestionGenerator().then((question) => {
  console.log(question);
});

```
sidenotes:
QuotesPath,CharacterPath,MoviePath
Hebben een relatief pad nodig naar de databases.

*/
export class Util {
  // Some class where you can make functions for like sorting, picking a question
  // To be decided
  public async QuestionGenerator(): Promise<IQuestion> {
    let Question: IQuestion;
 //   do {
      let Data: IQuote[] = await this.GetData(QuotesPath);
      let RandomQuote: IQuote = Data[Math.floor(Math.random() * Data.length)];
      let CorrectAnswers: any[] = [
        await this.GetMovie(RandomQuote.movie),
        await this.GetCharacter(RandomQuote.character),
      ];
      let BadAnswers: any[] = await this.GetBadMovies(CorrectAnswers[0].id);
      BadAnswers = BadAnswers.concat(
        await this.GetBadCharacters(CorrectAnswers[1].id)
      );
      Question = {
        QuoteId: RandomQuote.id,
        Dialog: RandomQuote.dialog,
        CorrectAnswers: CorrectAnswers,
        BadAnswers: BadAnswers,
      };
    //} while (this.isBlacklisted(Question));
    return Question;
  }
  public async getBlacklistedQuestions(): Promise<IQuestion[]> {
    let rawData = fs.readFileSync(BlacklistedPath, "utf-8");
    let data: IQuestion[] = JSON.parse(rawData);
    return data;
  }
  public async getFavouritedQuestions(): Promise<IQuestion[]> {
    let rawDAta = fs.readFileSync(favouritePath, "utf-8");
    let data: IQuestion[] = JSON.parse(rawDAta);
    return data;
  }

  private isBlacklisted(question: IQuestion): boolean {
    if (!fs.existsSync(BlacklistedPath)) return false;

    let blacklistedData: IQuestion[] = JSON.parse(
      fs.readFileSync(BlacklistedPath, "utf-8")
    );
    if (blacklistedData.length < 0) return false;
    for (let i = 0; i < blacklistedData.length; i++) {
      if (blacklistedData[i].QuoteId == question.QuoteId) {
        return true;
      }
    }

    return false;
  }

  private async GetMovie(movieid: string): Promise<IMovie> {
    let Data: IMovie[] = await this.GetData(MoviePath);
    let DataLength: number = Data.length;
    let correctMovie: IMovie;
    for (let i = 0; i < DataLength; i++) {
      if (Data[i]._id == movieid) {
        correctMovie = Data[i];
        return correctMovie;
      }
    }
    throw new Error("movie not found.");
  }
  private async GetCharacter(characterid: string): Promise<ICharacter> {
    let Data: ICharacter[] = await this.GetData(CharacterPath);
    let DataLength: number = Data.length;
    let correctCharacter: ICharacter;
    for (let i = 0; i < DataLength; i++) {
      if (Data[i]._id == characterid) {
        correctCharacter = Data[i];
        return correctCharacter;
      }
    }
    throw new Error("character not found.");
  }
  private async GetBadMovies(correctMovieId: string): Promise<IMovie[]> {
    let Data: IMovie[] = await this.GetData(MoviePath);
    let RandomMovies: IMovie[] = [];
    for (let i = 0; i < 2; i++) {
      let randomMovie: IMovie = Data[Math.floor(Math.random() * Data.length)];
      if (randomMovie._id != correctMovieId) {
        RandomMovies.push(randomMovie);
      }
    }
    return RandomMovies;
  }
  private async GetBadCharacters(
    correctCharacterId: string
  ): Promise<ICharacter[]> {
    let Data: ICharacter[] = await this.GetData(CharacterPath);
    let RandomCharacters: ICharacter[] = [];
    for (let index = 0; index < 2; index++) {
      let randomCharacter: ICharacter =
        Data[Math.floor(Math.random() * Data.length)];
      if (randomCharacter._id != correctCharacterId) {
        RandomCharacters.push(randomCharacter);
      }
    }
    return RandomCharacters;
  }
  private async GetData(path: string): Promise<any[]> {
    let rawData = fs.readFileSync(path, "utf-8");
    let Data: string[] = await JSON.parse(rawData);
    return Data;
  }

  public static CapitalizeFirst(word: String) {
    return word.charAt(0).toUpperCase().toString() + word.substring(1);
  }
}

async function write() {
  let Q: IQuote[] = await Api.GetQuotes();
  fs.writeFileSync(QuotesPath, JSON.stringify(Q));
  let M: IMovie[] = await Api.GetMovies();
  fs.writeFileSync(MoviePath, JSON.stringify(M));
  let C: ICharacter[] = await Api.GetCharacters();
  fs.writeFileSync(CharacterPath, JSON.stringify(C));
}

async function testData() {
  await write();
  let ut: Util = new Util();
  ut.QuestionGenerator().then((q) => {
    console.log(q);
  });
}
testData();

export interface IQuestion {
  QuoteId: string;
  Dialog: string;
  rating?: boolean;
  CorrectAnswers: any[];
  BadAnswers: any[];
}
