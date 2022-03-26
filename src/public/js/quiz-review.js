const count = document.getElementById("count");
const maxCount = document.getElementById("maxCount");

const prevButton = document.getElementById("prevSub");
const nextButton = document.getElementById("nextSub");

let countNumber = parseInt(count.textContent);
let countMaxNumber = parseInt(maxCount.textContent);

if(countNumber == countMaxNumber-1) nextButton.disabled = true;
else if(countNumber == 0) prevButton.disabled = true
