const characterOptions = document.querySelectorAll(".quiz-character-option");
const movieOptions = document.querySelectorAll(".quiz-movie-option");

const quizSubmit = document.getElementById("quiz-submit");
const quizDataOutputCharacter = document.getElementById("quiz-data-output-character");
const quizDataOutputMovie = document.getElementById("quiz-data-output-movie");

const outData = {};

if (!outData.movie || !outData.character)    quizSubmit.disabled = true;

characterOptions.forEach(option => option.onclick = () => setSelectedForOption(option, characterOptions, "character"));
movieOptions.forEach(option => option.onclick = () => setSelectedForOption(option, movieOptions, "movie"));

const setSelectedForOption = (option, list, type) => {
    list.forEach(o => o.style.backgroundColor = "transparent")
    option.style.backgroundColor = "#58a29e70";
    outData[type] = option.firstChild.textContent;

    if (outData.movie && outData.character) {
        quizDataOutputCharacter.value = outData["character"];
        quizDataOutputMovie.value = outData["movie"];
        quizSubmit.disabled = false;
    }
} 