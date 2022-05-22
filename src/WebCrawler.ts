const baseurl:string = "https://lotr.fandom.com/wiki/";
const {Scraper,Root,DownloadContent} = require('nodejs-web-scraper');
import fs = require('fs');
export class WebCrawler {
    constructor(){

    }
    /*
    . ScrapeImage is async
    . Download character image naar \GremlinsAP\public\assets\images\CharacterImages\
    . Logs worden in \GremlinsAP\webScraperLogs\ geschreven.
    . Kan zijn dat er geen foto is voor een karakter(bv: Adrahil I).
    . Namen komen niet altijd overeen met die van het personage(bv: Frodo Baggins => Untitledjk.jpg)
    . Namen bevatten niet enkel de naam van het karakter.
    . Extenties zijn niet altijd jpg maar kunnen ook png zijn.
    
    
    example:
    import { WebCrawler } from "./WebCrawler";
    let crawl = new WebCrawler()
    crawl.ScrapeImage("Adrahil I")
    */ 
    public async ScrapeImage(CharacterName:string){
        const config = {
            baseSiteUrl:baseurl,
            startUrl:"https://lotr.fandom.com/wiki/"+CharacterName.replaceAll(" ","_"),
            filePath:'./public/assets/images/CharacterImages',
            concurrency: 1,
            logPath:'./webScraperLogs',
            
        }  
        const scraper = new Scraper(config);
        const root = new Root();
        
        const image = new DownloadContent('aside figure a img',{
        class:'pi-image-thumbnail'});
        root.addOperation(image);
        scraper.scrape(root)
    }
}
