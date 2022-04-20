//let s = require("./jquery-3.6.0");
const mainElement = document.getElementById("quiz-box");

//============================================= DATA REQUEST =====================================================

let quizData = {};
let userAnswers = {};
let userRate = {};

const requestQuizData = async () => {
    await fetch("/quiz-data", {
        method: "GET",
        headers: { 'Content-Type': 'application/json' }
    }).then(data => data.json()).then(data => setQuizData(data));
};

const postQuizData = async (data, callback) => {
    await fetch("/quiz-data", {
        method: "POST",
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    callback();
};

const setQuizData = (data) => quizData = data;
const getQuizData = () => quizData;

const requestPageAndSet = async (name) => {
    let page = await fetch(`/pages/quiz/${name}.html`);
    let text = await page.text();
    $(mainElement).html(text);
}

//============================================= MAIN HANDLING ===================================================

const startQuiz = (mode) => postQuizData({ startQuiz: true, gamemode: mode }, () => reload(true));
const handleBegin = (data) => {
    $(mainElement).find(".start-quiz").on('click', () => { data.quizState = "gamemode"; reload(false); });
}

const handleGamemode = (data) => {
    let quizMain = $(mainElement).find("#quiz-main-gamemode");
    $(quizMain).find(".start-quiz-ten").on('click', () => startQuiz("ten"));
    $(quizMain).find(".start-quiz-suddendeath").on('click', () => startQuiz("suddendeath"));
}

const handleActive = (data) => {
    let quizHead = $(mainElement).find("#quiz-head");
    let quizMain = $(mainElement).find("#quiz-main");
    let quizFooter = $(mainElement).find("#quiz-footer");

    quizHead.find("button").on('click', () => {
        postQuizData({ reset: true }, () => {
            reload(true);
        });
    });

    let question = data.question;

    // Set quote cite
    quizMain.find("cite").find("h1").text(`${data.questionIndex + 1}. ${question.Dialog}`);

    let characterOptions = [];
    let movieOptions = [];

    // Create options divs
    question.possibleCharacters.forEach(character => characterOptions.push($(`<div class="quiz-character-option"><h2>${character.name}</h2></div>`)));
    question.possibleMovies.forEach(movie => movieOptions.push($(`<div class="quiz-movie-option"><h2>${movie.name}</h2></div>`)));

    let characterOptionsDiv = quizMain.find(".character-options");
    let movieOptionsDiv = quizMain.find(".movie-options");

    // Add options to the quiz
    characterOptionsDiv.append(characterOptions);
    movieOptionsDiv.append(movieOptions);

    let characterElements = characterOptionsDiv.find("div");
    let movieElements = movieOptionsDiv.find("div");
    let submitButton = $(mainElement).find("#quiz-submit");

    // Click events for options
    for (let ce = 0; ce < characterElements.length; ce++) {
        let characterElement = characterElements[ce];
        let movieElement = movieElements[ce];

        characterElement.onclick = () => handleOptionSelection(characterElement, characterElements, "character", question.possibleCharacters[ce]._id, submitButton[0]);
        movieElement.onclick = () => handleOptionSelection(movieElement, movieElements, "movie", question.possibleMovies[ce]._id, submitButton[0]);
    }

    quizFooter.find("h2").text(`${data.questionIndex + 1} of ${data.quizType == 0 ? "Infinite" : data.questionIndexMax} Questions`);
    submitButton.on('click', async () => {
        setSubmitState(submitButton, true);
        await postQuizData({
            userAnswer: userAnswers
        }, () => {
            reload(true);
        });
    });
}

const handleReview = (data) => {
    let reviewData = data.reviewData;
    let quizHead = $(mainElement).find("#quiz-head");
    let quizMain = $(mainElement).find("#quiz-main");
    let quizFooter = $(mainElement).find("#quiz-footer");

    quizHead.find("button").on('click', () => {
        postQuizData({ reset: true }, () => { reload(true); });
    });

    let question = data.reviewData.questions[data.questionIndex];

    // Set quote cite
    quizMain.find("cite").find("h1").text(`${data.questionIndex + 1}. ${question.Dialog}`);

    let characterOptions = [];
    let movieOptions = [];

    // Create options divs
    question.possibleCharacters.forEach(character => {
        let optionEl = $(`<div class="flex evenspace quiz-character-option"><h2>${character.name}</h2></div>`);
        let correct = question.correctAnswer[0] == character._id
        let selected = question.userAnswer[0] == character._id;
        optionEl.html(optionEl.html() + ` <h2>${correct && selected ? "+0.5" : ""}</h2>`)
        characterOptions.push(optionEl.addClass(correct ? "quiz-correct-option" : selected ? "quiz-wrong-option" : ""));
    });

    question.possibleMovies.forEach(movie => {
        let optionEl = $(`<div class="flex evenspace quiz-movie-option"><h2>${movie.name}</h2></div>`);
        let correct = question.correctAnswer[1] == movie._id
        let selected = question.userAnswer[1] == movie._id;
        optionEl.html(optionEl.html() + ` <h2>${correct && selected ? "+0.5" : ""}</h2>`)
        movieOptions.push(optionEl.addClass(correct ? "quiz-correct-option" : selected ? "quiz-wrong-option" : ""))
    });

    let characterOptionsDiv = quizMain.find(".character-options");
    let movieOptionsDiv = quizMain.find(".movie-options");

    // Add options to the quiz
    characterOptionsDiv.append(characterOptions);
    movieOptionsDiv.append(movieOptions);

    let previousButton;
    (previousButton = quizFooter.find("#prevSub")).on('click', (e) => {
        if (data.questionIndex - 1 >= 0) {
            postQuizData({ navigator: { previous: true } }, () => {
                data.questionIndex--;
                reload(false);
            });
        }
    });

    if (data.questionIndex == 0) previousButton[0].disabled = true;

    let nextButton;
    (nextButton = quizFooter.find("#nextSub")).on('click', () => {
        if (data.questionIndex + 1 < data.questionIndexMax) {
            postQuizData({ navigator: { next: true } }, () => {
                data.questionIndex++;
                reload(false);
            });
        }
    });
    if (data.questionIndex == data.questionIndexMax - 1) nextButton[0].disabled = true;

    setupRates(question.QuoteId);

    quizFooter.find(".quiz-total-score").text(`Total Score: ${reviewData.score} / ${data.questionIndexMax}`)
}

const reload = async (reloadData) => {

    // Request initial data
    if (reloadData) await requestQuizData();

    userAnswers = {};

    let data = getQuizData();
    await requestPageAndSet(data.quizState);

    switch (data.quizState) {
        case "begin": handleBegin(data); break;
        case "gamemode": handleGamemode(data); break;
        case "active": handleActive(data); break;
        case "review": handleReview(data); break;
    }
}

// Main
reload(true);

//============================================= OPTION HANDLING =================================================

const handleOptionSelection = (option, list, type, id, submitButton) => {
    for (let i of list) {
        if (i != option) i.style.backgroundColor = "transparent";
        else i.style.backgroundColor = "#58a29e70";
    }

    userAnswers[type] = id;
    checkAndSetNextQuestionButtonState(submitButton);
}

const checkAndSetNextQuestionButtonState = (submitButton) => {
    if (userAnswers.movie && userAnswers.character) setSubmitState(submitButton, false);
}

const setSubmitState = (submit, disabled) => {
    submit.disabled = disabled;
}

//============================================= RATE HANDLING ====================================================

const getRates = async (quoteId) => {
    await fetch(`/rate/${quoteId}`, {
        method: "GET",
        headers: { 'Content-Type': 'application/json' }
    }).then(data => data.json()).then(rateData => userRate = rateData);
}

// apply like value, to set the rate buttons to the correct state when already liked etc
const setupRates = async (quoteId) => {

    // Fetch current state for rate
    await getRates(quoteId);

    // Rate (Like & Dislike)
    let rateButtons = $(mainElement).find(".rate-button");

    for (let button of rateButtons) {
        switch (button.name) {
            case "like":
                if (userRate.favorite) button.style.backgroundColor = "green";
                break;
            case "dislike":
                if (userRate.blacklisted) button.style.backgroundColor = "red";
                break;
        }
    }

    rateButtons.on("click", async (e) => {

        for (let button of rateButtons)
            if (button != e.target) button.style.backgroundColor = "unset";

        let isSelected = false;
        switch (e.target.name) {
            case "like":
                isSelected = e.target.style.backgroundColor == "green";

                if (!isSelected) { // If it wasn't selected and now will be
                    await postRate(true, quoteId, "");
                    await removeRate(false, quoteId);
                } else { // If was selected, but you undo it
                    await removeRate(true, quoteId);
                }

                e.target.style.backgroundColor = isSelected ? "unset" : "green";
                break;
            case "dislike":
                isSelected = e.target.style.backgroundColor == "red";

                if (!isSelected) { // If it wasn't selected and now will be
                    let reasondislike = prompt("Geef de reden waarom je dit als blacklist quote wil", "");

                    if (reasondislike != null && reasondislike != "") {
                        await postRate(false, quoteId, reasondislike);
                        await removeRate(true, quoteId);
                    } else isSelected = true;
                } else { // If was selected, but you undo it
                    await removeRate(false, quoteId);
                }

                e.target.style.backgroundColor = isSelected ? "unset" : "red";
                break;
        }
    });
}

const postRate = async (favorite, quoteId, reason) => {
    await fetch("/rate-quote", {
        method: "POST",
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: favorite ? "favorite" : "blacklist",
            action: "add",
            quoteId: quoteId,
            reason: reason
        })
    })
}

const removeRate = async (favorite, quoteId) => {
    await fetch("/rate-quote", {
        method: "POST",
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: favorite ? "favorite" : "blacklist",
            action: "remove",
            quoteId: quoteId
        })
    })
}