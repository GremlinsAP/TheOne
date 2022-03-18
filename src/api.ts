import axios from "axios";

//HOE DE CALL MAKEN:
//document importeren.
// import { Api } from "./api";

//de functie geeft een promise terug dus zorg dat je deze behandeld.
/*
voorbeeld:

public async showdata() {
    let data = await Api.GetQuotes();
}
*/

//opgepast de GetSpecificData functie heeft een path nodig en een id
/*
VOORBEELD:
Api.GetSpecificData("/character","abcd123456");
*/

export class Api {
  public static readonly token = process.env.API_TOKEN;
  public static readonly instance = axios.create({
    baseURL: "https://the-one-api.dev/v2/",
    timeout: 1000,
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

  public static async GetSpecificData(
    path: string,
    id: string = ""
  ): Promise<any[]> {
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
  id: string;
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
