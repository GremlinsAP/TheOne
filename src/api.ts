import axios from "axios";
const { config } = require("dotenv").config();

/*
Quick guide voor api calls
1. import class "import { Api } from "./api";".
2. mocht dit nog niet gebeurd zijn creër Json files met CreatJsonFiles van utils.
2. call maken "Api.GetQuotes();" (promises).

De functies geven een promise terug dus zorg dat je deze behandeld.
voorbeeld:
```
public async showdata() {
    let data = await Api.GetQuotes();
}
```

opgepast de GetSpecificData functie heeft een path nodig en een id
(paths: https://the-one-api.dev/documentation#4)
VOORBEELD:
Api.GetSpecificData("/character","abcd123456");
*/

export class Api {
  private static readonly token = process.env.API_TOKEN;

  public static readonly instance = axios.create({
    baseURL: "https://the-one-api.dev/v2/",
    timeout: 3000,
    headers: { Authorization: `Bearer ${this.token}` },
  });

  public static async GetQuotes(): Promise<IQuote[]> {
    let rawJsonData = await this.instance.get("/quote");
    let quotes: IQuote[] = rawJsonData.data.docs;
    return quotes;
  }

  public static async GetMovies(): Promise<IMovie[]> {
    let rawJsonData = await this.instance.get(`/movie`);
    let movies: IMovie[] = rawJsonData.data.docs;
    return movies;
  }

  public static async GetCharacters(): Promise<ICharacter[]> {
    let rawJsonData = await this.instance.get("/character");
    let characters: ICharacter[] = rawJsonData.data.docs;
    return characters;
  }

  public static async GetSpecificData(path: string, id: string = ""): Promise<any[]> {
    let rawJsonData = await this.instance.get(`${path}/${id}`);
    let Data = rawJsonData.data.docs;
    return Data;
  }
}

export interface IQuote {
  _id: string;
  dialog: string;
  movie: string;
  character: string;
  id: string;
}

export interface IMovie {
  _id: string;
  name: string;
  runtimeInMinutes: number;
  budgetInMillions: number;
  boxOfficeRevenueInMillions: number;
  academyAwardNominations: number;
  academyAwardWins: number;
  rottenTomatoesScore: number;
}

export interface ICharacter {
  _id: string;
  height: string;
  race: string;
  gender: string;
  birth: string;
  spouse: string;
  death: string;
  realm: String;
  hair: string;
  name: string;
  wikiURL: string;
}
