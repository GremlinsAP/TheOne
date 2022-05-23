import { WebCrawler } from "./WebCrawler";
let crawl = new WebCrawler()
async function getImages(){
    let characters:string[] = ["Gríma Wormtongue","Peregrin Took","Saruman","Mauhúr","Éowyn","Éomer","Lugdush","Denethor II","Celeborn","Meriadoc Brandybuck","Barliman Butterbur","Gamling","Samwise Gamgee","Gimli","Gorbag","Grimbold","Arwen","Elrond","Uglúk","Aragorn II Elessar","Faramir","Legolas","Master of Lake-town","Thorin II Oakenshield","Dwalin","Bofur","Bard","Shelob","Gandalf","Galadriel","Thrór","Frodo Baggins","Sauron","Balin","Théodwyn","Eärendil","Treebeard","Witch-King of Angmar","Bilbo_Baggins","Gollum","King of the Dead","Gothmog (Balrog)","Khamûl"]
    console.log(characters.length)
    for (let i = 0; i < characters.length; i++) {
        await crawl.ScrapeImage(characters[i]);
    }
    console.log(characters.length)
}
getImages().then(()=>{
crawl.renameUnsolved();
})
