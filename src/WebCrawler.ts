const baseurl: string = "https://lotr.fandom.com/wiki/";
const { Scraper, Root, DownloadContent } = require('nodejs-web-scraper');
import fs = require('fs');
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
    public async CreateImages(Names: string[]) {
        for (let i = 0; i < Names.length; i++) {
            await this.ScrapeImage(Names[i]);
        }
        await this.renameUnsolved();
    }

    public async ScrapeImage(CharacterName: string):Promise<string> {
        CharacterName = CharacterName.replaceAll(" ", "_");
        const config = {
            baseSiteUrl: baseurl,
            startUrl: "https://lotr.fandom.com/wiki/" + CharacterName,
            filePath: imagePath,
            concurrency: 1,
            logPath: './webScraperLogs',

        }
        const scraper = new Scraper(config);
        const root = new Root();

        const image = new DownloadContent('aside figure a img', {
            class: 'pi-image-thumbnail'
        });




        root.addOperation(image);
        await scraper.scrape(root)
        return await this.renameFile(CharacterName)
    }

    private doesImgExist(name: string): boolean {
        return fs.existsSync(imagePath + "/" + name + ".jpg")
            || fs.existsSync(imagePath + "/" + name + ".png");
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
            /*
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
            */
            if (fs.existsSync(imagePath + '/' + substr)) fs.rename(imagePath + '/' + substr, imagePath + "/" + newName + suffix, (error) => { if (error) console.error(error) });
            return imagePath + "/" + newName + suffix;
        }
        return "";
    }
    private async renameUnsolved() {
        const unsolvedNames = [{ solution: "Smaugh.jpg", name: "%2522And_do_you_now%253F%2522.JPG.jpg" }, { name: "250px-Elawen_Altariel_-_Th%253Fodwyn_of_Rohan.jpg", solution: "Elawen_Altariel.jpg" }, { solution: "Frodo_Baggins.png", name: "Untitledjk.png" }, { solution: "Uglúk.jpg", name: "Ugl%3FK.jpg" }, { solution: "Éowyn.jpg", name: "%253Fowyn_of_Rohan_%252860%2529.jpg" }]
        unsolvedNames.forEach(character => {
            if (fs.existsSync(imagePath + "/" + character.name)) fs.rename(imagePath + "/" + character.name, imagePath + "/" + character.solution, (error) => { if (error) console.error(error) });
        });
    }
    public clearCharacterDirectory() {
        fs.readdir(imagePath, (error, files) => {
            if (error) console.error(error);
            for (const file of files) {
                fs.unlink(imagePath + "/" + file, (error) => {
                    if (error) console.error(error);
                });
            }
        });
    }
}
