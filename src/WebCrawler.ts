const baseurl:string = "https://lotr.fandom.com/wiki/";
const {Scraper,Root,DownloadContent} = require('nodejs-web-scraper');
import fs = require('fs');
const imagePath = "./public/assets/images/CharacterImages";
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
        CharacterName = CharacterName.replaceAll(" ","_");
        const config = {
            baseSiteUrl:baseurl,
            startUrl:"https://lotr.fandom.com/wiki/"+CharacterName,
            filePath:imagePath,
            concurrency: 1,
            logPath:'./webScraperLogs',
            
        }  
        const scraper = new Scraper(config);
        const root = new Root();
        
        const image = new DownloadContent('aside figure a img',{
        class:'pi-image-thumbnail'});
        root.addOperation(image);
        await scraper.scrape(root)
        await this.renameFile(CharacterName)
    
    }
    private async renameFile (newName:string){
        let data:any = fs.readFileSync('./webScraperLogs/log.json','utf8');
        if(data.length >0){
            data = await JSON.parse(data);
        }else {
            return;
        }
        let substr:string = data.data[0].data[0].substring(51).split("/")[0];
        let suffix:string = substr.substring(substr.indexOf("."));
        //#region console logging
        console.log("-".repeat(30))
        console.log("search url: ",data.address);
        console.log("content url: ",data.data[0].data[0]);
        console.log("substring: ",substr)
        console.log("suffix: "+suffix)
        console.log("new name: "+newName+suffix);
        console.log("new path: "+imagePath+"/"+newName+suffix)
        console.log("-".repeat(30))
        //#endregion
        fs.rename(imagePath+'/'+substr,imagePath+"/"+newName+suffix,(error)=>{if(error)console.error(error)});
    }
}
