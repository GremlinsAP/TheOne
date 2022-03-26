const count = document.getElementById("count");
const maxCount = document.getElementById("maxCount");

const prevButton = document.getElementById("prevSub");
const nextButton = document.getElementById("nextSub");

let countNumber = parseInt(count.textContent);
let countMaxNumber = parseInt(maxCount.textContent);

if(countNumber == countMaxNumber) {
    nextButton.disabled = true;
}else if(countNumber == 1) {
    prevButton.disabled = true
}