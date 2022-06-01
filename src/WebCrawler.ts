const baseurl: string = "https://lotr.fandom.com/wiki/";
const { Scraper, Root, DownloadContent } = require('nodejs-web-scraper');
import fs = require('fs');
import { Util } from './utils';
const imagePath = "./public/assets/images/CharacterImages";

export class WebCrawler {
    constructor() {

    }
    /*
    notes:
    . CreateImages & clearCharacterDirectory zijn async.
    . Kan zijn dat er geen foto is voor een karakter(voorbeeld: Adrahil I).
    . De file namen kunnen meer dan enkel de naam bevatten.
    . Namen hebben underscores in plaats van spaties (voorbeeld:"Frodo Baggins" => "Frodo_Baggins").
    . Extenties zijn niet altijd jpg maar kunnen ook png zijn.
    . ITS SLOW!!!
    . Logs worden in \GremlinsAP\webScraperLogs\ geschreven.
    . Afbeeldingen worden in \GremlinsAP\public\assets\images\CharacterImages\ opgeslagen.
    . Indien er geen afbeeling bestaan voor een character moet je \public\assets\images\unknownCharacter.png gebruiken.
    . Alle afbeeldingen kunnen worden verwijderd met clearCharacterDirectory

    example code:
--------------------------------------------------------
    create files example:
    
    import { WebCrawler } from "./WebCrawler";
    let crawl = new WebCrawler()

    let characters:string[] = ["Gríma Wormtongue","Peregrin Took","Saruman"]
    crawl.CreateImages(characters);

-------------------------------------------------------
    delete files example:
     
    getImages().then(()=>{
        crawl.renameUnsolved();
    }).then(()=>{
        crawl.clearCharacterDirectory();
    })

*/
    private static cachedImages: Map<string, string> = new Map();

    public async CreateImages(Names: string[]) {
        for (let i = 0; i < Names.length; i++) {
            await this.ScrapeImage(Names[i]);
        }
    }

    public async ScrapeImage(CharacterName: string): Promise<string> {
        if(WebCrawler.cachedImages.has(CharacterName)) return WebCrawler.cachedImages.get(CharacterName)!;
        
        CharacterName = CharacterName.replace("\ \g", "_");
        const config = {
            baseSiteUrl: baseurl,
            startUrl: "https://lotr.fandom.com/wiki/" + CharacterName,
            filePath: imagePath,
            concurrency: 1,
            logPath: './webScraperLogs',
            showConsoleLogs:false
        }
        const scraper = new Scraper(config);
        const root = new Root();

        const image = new DownloadContent('aside figure a img', {
            class: 'pi-image-thumbnail'
        });

        root.addOperation(image);
        await scraper.scrape(root);
  
        let name = await this.renameFile(CharacterName);
        WebCrawler.cachedImages.set(CharacterName.replace("\_\g", " "), name);

        return name;
    }

    private async renameFile(newName: string): Promise<string> {
        let data: any = fs.readFileSync('./webScraperLogs/log.json', 'utf8');
        if (data.length > 0) {
            try {
                data = await JSON.parse(data);
            } catch (error) {
                console.error(error);
            }
        } else {
            return "";
        }

        if (data && data.data[0] && data.data[0].data[0]) {
            let substr: string = data.data[0].data[0].substring(51).split("/")[0];
            let suffix: string = substr.substring(substr.indexOf("."));
            let file = new Util().getMostRecentFile(imagePath)?.file;
      
            if(fs.existsSync(imagePath + '/' + file))  
                fs.renameSync(imagePath + '/' + file, imagePath + "/" + newName + suffix);

           return imagePath + "/" + newName + suffix;
        }
        return "";
    }


}
