const mainContainer = document.getElementById("rating_page");
const favorites = $(mainContainer).find(".rate-item");
const downloadButton = $(mainContainer).find(".favorites-download");

for (let favoritedItem of favorites) {
    let quoteId = favoritedItem.attributes[0].nodeValue;
    let trashButton = $(favoritedItem).find(".remove-favorites-item");

    trashButton.on("click", (e) => {
        $(favoritedItem).css('-webkit-animation', 'fadeOut 400ms');
        $(favoritedItem).bind('webkitAnimationEnd', () => $(favoritedItem).remove());
        removeRate(quoteId);
    });
}

downloadButton.on("click", (e) => {
    download(favorites)
});

const removeRate = async (quoteId) => {
    await fetch("/rate-quote", {
        method: "POST",
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: "favorite",
            action: "remove",
            quoteId: quoteId
        })
    });
}

const download = async (favorites) => {
    console.log("\nFile Contents of file before append:",
        fs.readFileSync("favorites.txt", "utf8"));

    fs.appendFileSync("favorites.txt", favorites);

    // Get the file contents after the append operation
    console.log("\nFile Contents of file after append:",
        fs.readFileSync("favorites.txt", "utf8"));
}