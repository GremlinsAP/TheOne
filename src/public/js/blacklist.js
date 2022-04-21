const mainContainer = document.getElementById("blacklist_container");
const blacklists = $(mainContainer).find(".blacklist-item");


for (let blacklistItem of blacklists) {
    let quoteId = blacklistItem.attributes[0].nodeValue;

    let editButton = $(blacklistItem).find(".edit-blacklist-item");
    let trashButton = $(blacklistItem).find(".remove-blacklist-item");


    let submitEdit = $(blacklistItem).find(".edit-blacklist-submit");

    console.log(submitEdit)

    editButton.on("click", (e) => {
        let editBox = $(blacklistItem).find(".blacklist-edit");

        console.log(editBox.css("display"));
        editBox.css("display", editBox.css("display") == "flex" ? "" : "flex");
    });

    trashButton.on("click", (e) => {

        $(blacklistItem).css('-webkit-animation', 'fadeOut 400ms');
        $(blacklistItem).bind('webkitAnimationEnd', () => {
            $(blacklistItem).remove();
        });
        removeRate(quoteId);
    });

    submitEdit.on("click", (e) => {
        let edittextContent = $(blacklistItem).find("textarea");
        let boxVal = edittextContent.val();

        let valueText = boxVal.trim();

        if (valueText != "") {
            edittextContent.val("");
            $(blacklistItem).find(".blacklist-edit").css("display", "");
            editRate(quoteId, valueText);
            $(blacklistItem).find(".blacklist-item-reason").text(`Reason: ${valueText}`);
        }
    });
}

const editRate = async (quoteId, editText) => {
    await fetch("/rate-quote", {
        method: "POST",
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: "blacklist",
            action: "edit",
            quoteId: quoteId,
            reason:editText
        })
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
            type: "blacklist",
            action: "remove",
            quoteId: quoteId
        })
    });
}