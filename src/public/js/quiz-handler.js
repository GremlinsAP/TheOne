const characterOptions = document.querySelectorAll(".quiz-character-option");
const movieOptions = document.querySelectorAll(".quiz-movie-option");

const quizSubmit = document.getElementById("quiz-submit");
const quizDataOutputCharacter = document.getElementById("quiz-data-output-character");
const quizDataOutputMovie = document.getElementById("quiz-data-output-movie");

const outData = {};

characterOptions.forEach(option => option.onclick = () => setSelectedForOption(option, characterOptions, "character"));
movieOptions.forEach(option => option.onclick = () => setSelectedForOption(option, movieOptions, "movie"));
const setSelectedForOption = (option, list, type) => {
    list.forEach(o => o.style.backgroundColor = "transparent")
    option.style.backgroundColor = "green";
    outData[type] = option.firstChild.textContent;
    console.log(outData);

    if (outData.movie && outData.character) {
        quizSubmit.disabled = false;
        quizDataOutputCharacter.value = outData["character"];
        quizDataOutputMovie.value = outData["movie"];
    }
} 