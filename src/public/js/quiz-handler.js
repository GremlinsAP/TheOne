// Rate (Like & Dislike)
/*const rateButtons = document.querySelectorAll(".rate-button");
rateButtons.forEach(button => {
    button.onclick = () => {
        fetch(`/${button.name}-quote`, {
            method: "GET",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: button.value })
        });

        rateButtons.forEach(c => c.style.backgroundColor = "transparent")
        switch (button.name) {
            case "like":
                button.style.backgroundColor = "green";
                break;
            case "dislike":
                button.style.backgroundColor = "red";
                break;
        }
    }
});*/

//============================================= DATA REQUEST =====================================================

let quizData = {};

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

const mainElement = document.getElementById("quiz-page");
const requestPageAndSet = async (name) => {
    let page = await fetch(`/pages/quiz/${name}.html`);
    let text = await page.text();
    $(mainElement).html(text);
}

//============================================= MAIN HANDLING ===================================================

const startQuiz = () => postQuizData({ startQuiz: true }, () => reload(true));
const handleBegin = (data) => $(mainElement).find(".start-quiz").on('click', () => startQuiz());

const userAnsers = {};
const handleActive = (data) => {
    let quizHead = $(mainElement).find("#quiz-head");
    let quizMain = $(mainElement).find("#quiz-main");
    let quizFooter = $(mainElement).find("#quiz-footer");

    quizHead.find("button").on('click', () => {
        postQuizData({ reset: true }, () => {
            quizData = {};
            reload(true);
        });
    });

    let question = data.questions[data.questionIndex];

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

    quizFooter.find("h2").text(`${data.questionIndex + 1} of ${data.questionIndexMax} Questions`);
    submitButton.on('click', async () => {
        setSubmitState(submitButton, true);

        await postQuizData({
            userAnswer: userAnsers
        }, () => {
            data.questionIndex++;
            reload(data.questionIndex >= data.questionIndexMax);
        });
    });
}

const handleReview = (data) => {
    let reviewData = data.reviewData;
    let quizHead = $(mainElement).find("#quiz-head");
    let quizMain = $(mainElement).find("#quiz-main");
    let quizFooter = $(mainElement).find("#quiz-footer");

    quizHead.find("button").on('click', () => {
        postQuizData({ reset: true }, () => {
            reload(true);
        });
    });

    let question = data.questions[data.questionIndex];

    // Set quote cite
    quizMain.find("cite").find("h1").text(`${data.questionIndex + 1}. ${question.Dialog}`);

    let characterOptions = [];
    let movieOptions = [];

    // Create options divs
    question.possibleCharacters.forEach(character => {
        let optionEl = $(`<div class="quiz-character-option"><h2>${character.name}</h2></div>`);
        let correct = reviewData.correctAnswers[data.questionIndex][0] == character._id
        let selected = character._id == reviewData.userAnswers[data.questionIndex][0];
        characterOptions.push(optionEl.addClass(correct ? "quiz-correct-option" : selected ? "quiz-wrong-option" : ""));
    });

    question.possibleMovies.forEach(movie => {
        let optionEl = $(`<div class="quiz-movie-option"><h2>${movie.name}</h2></div>`);
        let correct = reviewData.correctAnswers[data.questionIndex][1] == movie._id
        let selected = reviewData.userAnswers[data.questionIndex][1] == movie._id;
        movieOptions.push(optionEl.addClass(correct ? "quiz-correct-option" : selected ? "quiz-wrong-option" : ""))
    });

    let characterOptionsDiv = quizMain.find(".character-options");
    let movieOptionsDiv = quizMain.find(".movie-options");

    // Add options to the quiz
    characterOptionsDiv.append(characterOptions);
    movieOptionsDiv.append(movieOptions);

    quizFooter.find("#prevSub").on('click', () => {
        postQuizData({
            navigator: {
                previous: true
            }
        }, () => {
            if (data.questionIndex - 1 > 0) {
                data.questionIndex--;
                reload(false);
            }
        });
    });

    quizFooter.find("#nextSub").on('click', () => {
        postQuizData({
            navigator: {
                next: true
            }
        }, () => {
            if (data.questionIndex + 1 < data.questionIndexMax) {
                data.questionIndex++;
                reload(false);
            }
        });
    });

    quizFooter.find(".quiz-total-score").text(`Totale Score: ${reviewData.score} / ${data.questionIndexMax}`)
}

const reload = async (reloadData) => {

    // Request initial data
    if (reloadData) await requestQuizData();

    let data = getQuizData();
    await requestPageAndSet(data.quizState);

    switch (data.quizState) {
        case "begin":
            handleBegin(data);
            break;
        case "active":
            handleActive(data);
            break;
        case "review":
            handleReview(data);
            break;
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

    userAnsers[type] = id;
    checkAndSetNextQuestionButtonState(submitButton);
}

const checkAndSetNextQuestionButtonState = (submitButton) => {
    if (userAnsers.movie && userAnsers.character) setSubmitState(submitButton, false);
}

const setSubmitState = (submit, disabled) => {
    submit.disabled = disabled;
}