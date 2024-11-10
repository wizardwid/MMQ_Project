let currentQuestionIndex = 0;
let quizData = [];

document.addEventListener("DOMContentLoaded", () => {
    fetch('/quiz')
        .then(response => response.json())
        .then(data => {
            quizData = data;
            displayQuestion();
        });
});

function displayQuestion() {
    const questionContainer = document.getElementById("question");
    const choicesContainer = document.getElementById("choices");
    
    const question = quizData[currentQuestionIndex];
    questionContainer.textContent = question.question_text;

    choicesContainer.innerHTML = '';
    question.choices.forEach((choice, index) => {
        const button = document.createElement("button");
        button.textContent = choice;
        button.onclick = () => checkAnswer(choice);
        choicesContainer.appendChild(button);
    });
}

function checkAnswer(selectedChoice) {
    const correctAnswer = quizData[currentQuestionIndex].correct_answer;
    if (selectedChoice === correctAnswer) {
        alert("Correct!");
    } else {
        alert("Incorrect.");
    }
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
        displayQuestion();
    } else {
        alert("Quiz completed!");
    }
}
