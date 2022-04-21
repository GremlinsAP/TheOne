const mainContainer = document.getElementById("blacklist_container");
const blacklists = $(mainContainer).find(".blacklist-item");


for (let blacklistItem of blacklists) {
    let quoteId = blacklistItem.attributes[0].nodeValue;

    let editButton = $(blacklistItem).find(".edit-blacklist-item");
    let trashButton = $(blacklistItem).find(".remove-blacklist-item");

    editButton.on("click", (e) => {
        $(blacklistItem).find(".blacklist-edit").css("display", "block");
    });

    trashButton.on("click", (e) => {
   
        $(blacklistItem).css('-webkit-animation', 'fadeOut 400ms');
        $(blacklistItem).bind('webkitAnimationEnd', () => {
            $(blacklistItem).remove();
        });
        removeRate(quoteId);
    })
}

const removeRate = async (quoteId) => {
    await fetch("/rate-quote", {
        method: "POST",
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: "blacklist",
            action: "remove",
            quoteId: quoteId
        })
    })
}