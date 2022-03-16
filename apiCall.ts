const axios = require("axios");
require("dotenv").config();
const token = process.env.API_TOKEN;

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
  race: String;
  gender: string;
  birth: string;
  spouse: string;
  death: string;
  realm: String;
  hair: string;
  name: String;
  wikiURL: String;
}

const instance = axios.create({
  baseURL: "https://the-one-api.dev/v2/",
  timeout: 1000,
  headers: { Authorization: `Bearer ${token}` },
});

//HOE DE CALL MAKEN:
//document importeren.
//const api_call = require("./API-CAll");

//de functie geeft een promise terug dus zorg dat je deze behandeld.
/*
async function showdata() {
    let data = await apicall.GetQuotes();
}
*/
module.exports = {
  async GetQuotes() {
    let rawJsonData = await instance.get("/quote");
    let quotes: IQuote[] = rawJsonData.data.docs;
    return quotes;
  },
  async GetMovies(MovieID: string) {
    let rawJsonData = await instance.get(`/movie/${MovieID}`);
    let movies: IMovie[] = rawJsonData.data.docs;
    return movies;
  },
  async GetCharacters() {
    let rawJsonData = await instance.get("/character");
    let characters: ICharacter[] = rawJsonData.data.docs;
    return characters;
  },
};
