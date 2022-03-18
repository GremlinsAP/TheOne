import fs from "fs";
import { ICharacter, IMovie, IQuote, Api } from "./api";
const QuotesPath: string = "./quotes.json";
const CharacterPath: string = "./characters.json";
const MoviePath: string = "./movies.json";

/*
Quick guide voor question generator:
1. import class
2. defineer class object "let generator: Util = new Util();"
3. gebruik QuestionGenerator function (uses promises)
voorbeeld:
```
let Generator: Util = new Util();
wr.QuestionGenerator().then((question) => {
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
    let Question: IQuestion = {
      QuoteId: RandomQuote.id,
      Dialog: RandomQuote.dialog,
      CorrectAnswers: CorrectAnswers,
      BadAnswers: BadAnswers,
    };
    return Question;
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
    throw new Error("character not found.");
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
    let rawData = await fs.readFileSync(path, "utf-8");
    let Data: string[] = await JSON.parse(rawData);
    return Data;
  }
}
export interface IQuestion {
  QuoteId: string;
  Dialog: string;
  CorrectAnswers: any[];
  BadAnswers: any[];
}
