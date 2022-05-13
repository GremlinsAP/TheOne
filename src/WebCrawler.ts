const baseurl:string = "https://lotr.fandom.com/wiki/";
const {Scraper,Root,DownloadContent,OpenLinks,CollectContent} = require('nodejs-web-scraper');
export class WebCrawler {
    constructor(){

    }
    /*
    ScrapeImage is een async operatie.
    . CharacterName moet een Url vriendelijke naam bevatten.
    . download character image naar public/images/CharacterImages
    . logs worden in /WebScraperLogs geschreven.


    example:
    "import"

     let crawl:WebCrawler = new WebCrawler();
     crawl.ScrapeImage("Frodo_Baggins");
    */ 
    public async ScrapeImage(CharacterName:string){
        const config = {
            baseSiteUrl:baseurl,
            startUrl:"https://lotr.fandom.com/wiki/"+CharacterName,
            filePath:'./public/assets/images/CharacterImages',
            concurrency: 1,
            logPath:'./webScraperLogs'
        }  
        const scraper = new Scraper(config);
        const root = new Root();
        
        const image = new DownloadContent('aside figure a img',{
        class:'pi-image-thumbnail'});
        root.addOperation(image);
        await scraper.scrape(root);
    }
}