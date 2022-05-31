const mainContainer = document.getElementById("rating_page");
const favorites = $(mainContainer).find(".rate-item");
const names = $(mainContainer).find(".character-name");

for (let favoritedItem of favorites) {
    let quoteId = favoritedItem.attributes[0].nodeValue;
    let trashButton = $(favoritedItem).find(".remove-favorites-item");

    trashButton.on("click", (e) => {
        $(favoritedItem).css('-webkit-animation', 'fadeOut 400ms');
        $(favoritedItem).bind('webkitAnimationEnd', () => $(favoritedItem).remove());
        removeRate(quoteId);
    });
}

$(names).on("click", (e) => {
    window.location.replace(`/favorites?filter=${e.target.name}`)
})


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