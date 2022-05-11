const landingChoices = document.querySelectorAll(".landing-choice");
const landingOverlay = document.getElementById("landing-overlay");
const buttonOverlay = document.getElementById("landing-overlay-button");

landingChoices.forEach((element) => {
    element.onclick = (e) => {
        if(e.target.parentNode.href.endsWith("#")) landingOverlay.style.display = "block";
    }
});

buttonOverlay.onclick = (e) => {
    landingOverlay.style.display = "";
}

