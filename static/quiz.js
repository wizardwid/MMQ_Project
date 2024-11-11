const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const quizTitleInput = document.getElementById('quizTitle'); 
const settingButton = document.getElementById('setting'); 
const quizContainer = document.getElementById('quizContainer');
const saveBtn = document.getElementById('savebtn');

// 페이지 제목 업데이트 요소
const pageTitle = document.querySelector('.title');

// 페이지 로드 시 모달 자동 표시
window.addEventListener('DOMContentLoaded', () => {
    modal.style.display = "block"; // 모달을 표시
});

// 모달 닫기
span.onclick = function() {
    modal.style.display = "none"; // 닫기 버튼 클릭 시 모달 닫기
};

window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none"; // 모달 외부 클릭 시 모달 닫기
    }
};

// 제목 설정 버튼 클릭 시 페이지 상단 제목 설정 및 첫 퀴즈 생성
settingButton.onclick = function() { 
    const title = quizTitleInput.value.trim(); 
    if (title) {
        pageTitle.textContent = title; // 페이지 제목 설정
        modal.style.display = "none"; // 모달 닫기
        createQuiz(); // 첫 퀴즈 생성
        quizTitleInput.value = ''; // 입력 필드 초기화
    } else {
        alert("제목을 입력해 주세요."); // 제목이 비어 있을 경우 경고
    }
};

// 퀴즈 생성 함수
function createQuiz() {
    const quizDiv = document.createElement('div');
    quizDiv.className = 'quiz';
    
    // 퀴즈 내용 구성
    quizDiv.innerHTML = `
        <input type="text" name="question" class="question" placeholder="질문 입력" required></br>
        <input type="text" name="answer" class="answer" placeholder="답변 입력" required>
        <div class="button-container">
            <button type="button" class="deleteButton">삭제</button>
            <button type="button" class="addQuizButton">추가</button>
        </div>
    `;

    quizContainer.appendChild(quizDiv); // 퀴즈 컨테이너에 퀴즈 추가

    // 삭제 버튼 클릭 시 퀴즈 삭제
    quizDiv.querySelector('.deleteButton').addEventListener('click', function() {
        quizDiv.remove();
    });

    // 추가 버튼 클릭 시 새로운 퀴즈 생성
    quizDiv.querySelector('.addQuizButton').addEventListener('click', function() {
        // 빈 항목이 있는 경우에는 새로운 퀴즈를 추가하지 않음
        const questionInput = quizDiv.querySelector('input[name="question"]');
        const answerInput = quizDiv.querySelector('input[name="answer"]');
        
        if (!questionInput.value.trim() || !answerInput.value.trim()) {
            alert("질문과 답변을 모두 입력해주세요.");
            return;
        }

        createQuiz(); // 새 퀴즈 추가
    });
}

// saveBtn 이벤트
saveBtn.addEventListener('click', function() {
    const quizzes = Array.from(quizContainer.querySelectorAll('.quiz')).map(quiz => {
        const question = quiz.querySelector('input[name="question"]').value.trim();
        const answer = quiz.querySelector('input[name="answer"]').value.trim();

        if (question && answer) {
            return { question, answer };
        }
        return null;
    }).filter(Boolean); // 빈 값이 아닌 항목만 필터링

    if (quizzes.length === 0) {
        alert("최소 하나의 퀴즈를 작성해야 합니다.");
        return;
    }

    const quizData = {
        title: pageTitle.textContent,
        questions: quizzes  // quizzes는 [{question: "Q1", answer: "A1"}, {...}]
    };

    // 'questions' 데이터를 JSON 형식으로 변환하여 서버에 전송
    fetch('/quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'  // JSON 형식으로 전송
        },
        body: JSON.stringify({ title: quizData.title, questions: quizData.questions })  // JSON 문자열로 전송
    })
    .then(response => response.json())  // JSON 응답 처리
    .then(data => {
        if (data.success) {
            alert("퀴즈가 성공적으로 저장되었습니다!");
            window.location.href = '/quiz'; // 성공 시 퀴즈 페이지로 이동
        } else {
            alert("저장 중 문제가 발생했습니다: " + data.error);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("저장 중 문제가 발생했습니다.");
    });    
});

