const mainContainer = document.getElementById("favorites_container");
const favorites = $(mainContainer).find(".favorites-item");

for (let favoritedItem of favorites) {
    let quoteId = favoritedItem.attributes[0].nodeValue;
    let trashButton = $(favoritedItem).find(".remove-favorites-item");

    trashButton.on("click", (e) => {
        $(favoritedItem).css('-webkit-animation', 'fadeOut 400ms');
        $(favoritedItem).bind('webkitAnimationEnd', () => $(favoritedItem).remove());
        removeRate(quoteId);
    });
}

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