const baseurl:string = "https://lotr.fandom.com/wiki/";
const {Scraper,Root,DownloadContent} = require('nodejs-web-scraper');
import fs = require('fs');
const imagePath = "./public/assets/images/CharacterImages";
export class WebCrawler {
    constructor(){

    }
    /*
    notes:
    . ScrapeImage & renameUnsolved zijn async.
    . Kan zijn dat er geen foto is voor een karakter(voorbeeld: Adrahil I).
    . De file namen kunnen meer dan enkel de naam bevatten.
    . Namen hebben underscores in plaats van spaties (voorbeeld:"Frodo Baggins" => "Frodo_Baggins").
    . Extenties zijn niet altijd jpg maar kunnen ook png zijn.
    . De fotos moeten met awaits worden opgevraagd check voorbeeld code.
    . ITS SLOW!!!
    . Logs worden in \GremlinsAP\webScraperLogs\ geschreven.
    . Afbeeldingen worden in \GremlinsAP\public\assets\images\CharacterImages\ opgeslagen.

    example code:
    import { WebCrawler } from "./WebCrawler";
    let crawl = new WebCrawler()

   async function getImages(){
    let characters:string[] = ["Gollum","King of the Dead","Gothmog (Balrog)","Khamûl"]
    console.log(characters.length)
    for (let i = 0; i < characters.length; i++) {
        await crawl.ScrapeImage(characters[i]);
    }
    console.log(characters.length)
}
getImages().then(()=>{
crawl.renameUnsolved();
})
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
            try{
            data = await JSON.parse(data);
            }catch(error){
                console.error(error);
            }
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
    public async renameUnsolved(){
        fs.rename(imagePath+'/'+"%2522And_do_you_now%253F%2522.JPG.jpg",imagePath+"/"+"Smaugh.jpg",(error)=>{if(error)console.error(error)});
        fs.rename(imagePath+'/'+"250px-Elawen_Altariel_-_Th%253Fodwyn_of_Rohan.jpg",imagePath+"/"+"Elawen_Altariel.jpg",(error)=>{if(error)console.error(error)});
        fs.rename(imagePath+'/'+"Untitledjk.png",imagePath+"/"+"Frodo_Baggins.png",(error)=>{if(error)console.error(error)});
        fs.rename(imagePath+'/'+"Ugl%3FK.jpg",imagePath+"/"+"Uglúk.jpg",(error)=>{if(error)console.error(error)});
        fs.rename(imagePath+'/'+"%253Fowyn_of_Rohan_%252860%2529.jpg",imagePath+"/"+"Éowyn.jpg",(error)=>{if(error)console.error(error)});
    }
}
