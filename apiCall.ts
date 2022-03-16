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
    let data = await apicall.GetData();
}
*/
module.exports = {
  async GetData() {
    let rawJsonData = await instance.get("/quote");
    let quotes: IQuote[] = rawJsonData.data.docs;
    return quotes;
  },
};
