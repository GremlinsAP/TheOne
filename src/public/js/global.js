let accountButton = $(".account");
let accountDropDown = $(".account-dropdown")

let usernameField = $(accountDropDown).find("input");

accountButton.on("click", (e) => {
    accountDropDown[0].style.display = accountDropDown[0].style.display == "" ? "block" : "";
});

usernameField.change((e) => {
    let userVal = usernameField.val().trim();
    if (userVal != undefined && userVal != "") sendUsername(userVal);
});

const sendUsername = async (usernameval) => {
    await fetch("/session-settings", {
        method: "POST",
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username:usernameval})
    });
}

const getUsername = async () => {

    await fetch("/session-settings", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    }).then((data) => data.json()).then(json => usernameField.val(json.username));
}

const main = async () => {
    await getUsername();
}

main();