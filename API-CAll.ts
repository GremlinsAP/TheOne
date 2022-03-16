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
module.exports = {
  async GetData() {
    let rawJsonData = await instance.get("/quote");
    let quotes: IQuote[] = rawJsonData.data.docs;
    return quotes;
  },
};
