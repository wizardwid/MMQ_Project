const quizTitleElement = document.getElementById('quizTitle');
const quizContainer = document.getElementById('quizContainer');
const saveBtn = document.getElementById('savebtn');

// 퀴즈 제목 가져오기
const quizTitle = quizTitleElement ? quizTitleElement.textContent.trim() : '';

if (!quizTitle) {
    alert("제목이 누락되었습니다.");
} else {
    // 제목에 맞는 퀴즈 데이터 가져오기
    fetchQuizData(quizTitle);
}

// 퀴즈 데이터 가져오기
function fetchQuizData(title) {
    console.log("Fetching quizzes for title:", title);  // 제목 확인
    fetch(`/get_quizzes?title=${encodeURIComponent(title)}`)  // 제목을 URL 쿼리로 전달
        .then(response => {
            if (!response.ok) {
                throw new Error("퀴즈 데이터를 가져오는 데 문제가 발생했습니다: " + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Response data:", data);  // 응답 데이터 확인
            if (data.success) {
                quizContainer.innerHTML = ''; // 기존 퀴즈들 제거하여 중복 방지
                const quizzes = data.quizzes;
                if (quizzes.length > 0) {
                    quizzes.forEach(quiz => displayQuiz(quiz)); // 제목에 맞는 퀴즈만 표시
                } else {
                    alert("퀴즈를 찾을 수 없습니다.");
                }
            } else {
                alert(data.error);
            }
        })
        .catch(error => {
            console.error(error);
            alert(error.message);
        });
}

// 퀴즈 데이터 표시
function displayQuiz(quiz) {
    // 모든 질문과 답변을 표시하려면, quiz.questions 배열을 순회
    quiz.questions.forEach((questionData) => {
        const question = questionData.question || '';  // 질문
        const answer = questionData.answer || '';      // 답변
        const quizDiv = createQuizDiv(question, answer, quiz.id);
        quizContainer.appendChild(quizDiv);  // 각 질문을 quizContainer에 추가
    });
}

// 퀴즈 DIV 생성 함수
function createQuizDiv(question, answer, id = "") {
    const quizDiv = document.createElement('div');
    quizDiv.className = 'quiz';
    quizDiv.dataset.id = id;  // 퀴즈 ID 추가

    quizDiv.innerHTML = `
        <input type="text" name="question" class="question" placeholder="질문 입력" value="${question}" required></br>
        <input type="text" name="answer" class="answer" placeholder="답변 입력" value="${answer}" required>
        <div class="button-container">
            <button type="button" class="deleteButton">삭제</button>
            <button type="button" class="addQuizButton">추가</button>
        </div>
    `;

    // 삭제 버튼 클릭 시 퀴즈 삭제
    quizDiv.querySelector('.deleteButton').addEventListener('click', function() {
        const quizId = quizDiv.dataset.id;
        if (quizId) {
            fetch(`/delete_quiz/${quizId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("퀴즈가 성공적으로 삭제되었습니다.");
                    quizDiv.remove(); 
                } else {
                    alert("삭제 중 문제가 발생했습니다: " + data.error);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("삭제 중 문제가 발생했습니다.");
            });
        } else {
            quizDiv.remove(); 
        }
    });

    // 추가 버튼 클릭 시 새로운 빈 퀴즈 생성
    quizDiv.querySelector('.addQuizButton').addEventListener('click', function() {
        createQuiz(); 
    });

    return quizDiv;
}

// 빈 퀴즈 추가 함수
function createQuiz() {
    const quizDiv = createQuizDiv("", "", "");  // 빈 질문과 답변으로 추가
    quizContainer.appendChild(quizDiv); 
}

// 저장 버튼 클릭 시 퀴즈 저장
saveBtn.addEventListener('click', function() {
    const quizItems = quizContainer.querySelectorAll('.quiz');
    const quizzes = Array.from(quizItems).map(quizDiv => {
        const question = quizDiv.querySelector('.question').value;
        const answer = quizDiv.querySelector('.answer').value;
        const quizId = quizDiv.dataset.id || null;
        return { 
            id: quizId, 
            title: quizTitle, 
            question: question,
            answer: answer
        }; 
    });

    // 데이터 저장
    fetch(`/save_quiz`, {  // 변경된 URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            quizzes: quizzes.filter(quiz => 
                quiz.question.trim() !== "" && quiz.answer.trim() !== "" // 질문과 답변이 비어있지 않은 경우만 저장
            )
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("변경 사항이 저장되었습니다!");
            fetchQuizData(quizTitle); // 저장 후 해당 제목에 맞는 퀴즈만 새로 불러오기
        } else {
            alert("저장 중 문제가 발생했습니다: " + data.error);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("저장 중 문제가 발생했습니다.");
    });
});
