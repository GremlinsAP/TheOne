import axios, { AxiosInstance } from "axios";
const { config } = require("dotenv").config();

/*
Quick guide voor api calls
1. import class "import { Api } from "./api";".
2. mocht dit nog niet gebeurd zijn creër Json files met CreatJsonFiles van utils.
2. call maken "Api.GetQuotes();" (promises).

De functies geven een promise terug dus zorg dat je deze behandeld.
voorbeeld:

public async showdata() {
    let data = await Api.GetQuotes();
}
opgepast de GetSpecificData functie heeft een path nodig en een id
(paths: https://the-one-api.dev/documentation#4)
VOORBEELD:
Api.GetSpecificData("/character","abcd123456");
*/

export class Api {
  private static readonly TOKEN = process.env.API_TOKEN;
  private static readonly BACKUPTOKEN = process.env.API_TOKEN_BACKUP;

  private static instanceCreator(token: string): AxiosInstance {
    let instance = axios.create({
      baseURL: "https://the-one-api.dev/v2/",
      timeout: 3000,
      headers: { Authorization: `Bearer ${token}` },
    });
    return instance;
  }

  private static readonly INSTANCE = axios.create({
    baseURL: "https://the-one-api.dev/v2/",
    timeout: 3000,
    headers: { Authorization: `Bearer ${this.TOKEN}` },
  });

  public static async GetQuotes(): Promise<IQuote[]> {
    let rawJsonData = await this.INSTANCE.get("/quote");
    let quotes: IQuote[] = rawJsonData.data.docs;
    return quotes;
  }

  public static async GetMovies(): Promise<IMovie[]> {
    let rawJsonData: any;
    let movies: IMovie[];
    try {
      rawJsonData = await this.INSTANCE.get(`/movie`).catch((error: Error) => {
        throw error;
      });
    } catch (error: any) {
      if (error.code == 429) {
        let newinstance = await this.instanceCreator(this.BACKUPTOKEN!);
        rawJsonData = await newinstance("/movie");
      }
    } finally {
      movies = rawJsonData.data.docs;
      return movies;
    }
  }

  public static async GetCharacters(): Promise<ICharacter[]> {
    let rawJsonData: any;
    let characters: ICharacter[];
    try {
      rawJsonData = await this.INSTANCE.get("/character").catch(
        (error: Error) => {
          throw error;
        }
      );
    } catch (error: any) {
      console.log(error);
      if (error.code == 429) {
        let newinstance = await this.instanceCreator(this.BACKUPTOKEN!);
        rawJsonData = await newinstance.get("/character");
      }
    } finally {
      characters = rawJsonData.data.docs;
      return characters;
    }
  }

  public static async GetSpecificData(
    path: string,
    id: string = ""
  ): Promise<any[]> {
    let Data;
    let rawJsonData: any;
    try {
      rawJsonData = await this.INSTANCE.get(`${path}/${id}`).catch(
        (error: Error) => {
          throw error;
        }
      );
    } catch (error: any) {
      console.log(error);
      if (error.code == 429) {
        let newinstance = await this.instanceCreator(this.BACKUPTOKEN!);
        rawJsonData = await newinstance.get(`${path}/${id}`);
      }
    } finally {
      Data = rawJsonData.data.docs;
      return Data;
    }
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