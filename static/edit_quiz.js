const editQuizzesContainer = document.getElementById('editQuizzesContainer');
const modal = document.getElementById("editModal");
const newTitleInput = document.getElementById('newTitle');
const saveTitleBtn = document.getElementById('saveTitleBtn');
const closeModal = document.getElementById('closeModal');

let currentEditingQuizId = null;
let currentEditingQuizTitle = null;  // 현재 수정 중인 제목 저장
let quizzes = [];  // 현재 페이지에서 사용 중인 퀴즈 데이터

// 퀴즈 데이터 불러오기
window.addEventListener('DOMContentLoaded', () => {
    fetch('/get_quizzes')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                quizzes = data.quizzes;  // 퀴즈를 받아서 quizzes 배열에 저장
                loadQuizzes(quizzes);
            } else {
                alert("퀴즈를 불러오는 데 문제가 발생했습니다: " + data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("퀴즈를 불러오는 데 문제가 발생했습니다.");
        });
});

function loadQuizzes(quizzes) {
    // 제목별로 퀴즈들을 그룹화
    const groupedQuizzes = {};

    quizzes.forEach(quiz => {
        if (!groupedQuizzes[quiz.title]) {
            groupedQuizzes[quiz.title] = [];
        }
        groupedQuizzes[quiz.title].push(quiz);
    });

    // 기존 퀴즈 컨테이너 비우기
    editQuizzesContainer.innerHTML = '';

    // 그룹화된 퀴즈 내용 렌더링
    Object.keys(groupedQuizzes).forEach(title => {
        const quizDiv = document.createElement('div');
        quizDiv.className = 'quiz-container';
        quizDiv.dataset.title = title;
        const quizzesForThisTitle = groupedQuizzes[title];
        quizDiv.innerHTML = `
            <div class="quiz-title">${title}  
                <div class="icon-container">
                    <span class="edit-icon" data-id="${quizzesForThisTitle[0].id}">&#9998;</span>
                    <span class="delete-icon" data-title="${title}">&#128465;</span>
                 </div>
            </div>  
            <div class="quiz-content" style="display: none;">  
                ${quizzesForThisTitle.map(quiz => ` 
                    <div class="quiz-item">
                        <input type="checkbox" class="quiz-checkbox" data-id="${quiz.id}" />
                        <span>${quiz.content}</span>
                    </div>
                `).join('')}
            </div>
        `;
        editQuizzesContainer.appendChild(quizDiv);

        // 제목 클릭 시 퀴즈 세부 정보로 이동
        quizDiv.querySelector('.quiz-title').addEventListener('click', (e) => {
            if (!e.target.classList.contains('edit-icon') && !e.target.classList.contains('delete-icon')) {
                const quizId = quizzesForThisTitle[0].id;
                window.location.href = `/quiz/${quizId}`;
            }
        });

        // 수정 아이콘 클릭 시 모달 열기
        quizDiv.querySelector('.edit-icon').addEventListener('click', (e) => {
            e.stopPropagation();
            currentEditingQuizId = quizzesForThisTitle[0].id;
            currentEditingQuizTitle = title;
            newTitleInput.value = title;
            modal.style.display = "block";
        });

        // 삭제 아이콘 클릭 시 해당 제목에 속한 퀴즈들 삭제
        quizDiv.querySelector('.delete-icon').addEventListener('click', (e) => {
            const title = e.target.dataset.title;
            if (confirm(`정말로 '${title}' 제목의 퀴즈를 삭제하시겠습니까?`)) {
                deleteQuizzesByTitle(title, quizDiv);
            }
        });
    });
}

// 모달 닫기 이벤트
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    currentEditingQuizId = null;
    currentEditingQuizTitle = null;
});

// 제목 저장 버튼 클릭 이벤트
saveTitleBtn.addEventListener('click', () => {
    const updatedTitle = newTitleInput.value.trim();
    if (updatedTitle && updatedTitle !== currentEditingQuizTitle) {
        fetch('/save_updated_titles_quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: currentEditingQuizTitle,  // 수정 전 제목
                updatedTitle: updatedTitle       // 새로 수정된 제목
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("제목이 수정되었습니다.");
                fetchQuizzes();  // 제목 수정 후 퀴즈 목록을 새로 불러옴
                modal.style.display = 'none';  // 모달 닫기
            } else {
                alert("제목 수정에 실패했습니다: " + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("제목 수정에 실패했습니다.");
        });        
    } else {
        alert("제목을 변경해주세요.");
    }
});


// 퀴즈 목록을 새로 요청하여 갱신
function fetchQuizzes() {
    fetch('/get_quizzes')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                quizzes = data.quizzes;
                loadQuizzes(quizzes);
            } else {
                alert("퀴즈 목록 갱신에 문제가 발생했습니다: " + data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("퀴즈 목록을 갱신하는 데 문제가 발생했습니다.");
        });
}

// 제목에 속한 퀴즈들 삭제 함수
function deleteQuizzesByTitle(title, quizDiv) {
    fetch('/delete_quizzes_by_title', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`'${title}' 제목의 퀴즈들이 삭제되었습니다.`);
            quizDiv.remove();
            fetchQuizzes();
        } else {
            alert("퀴즈 삭제에 실패했습니다: " + data.error);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("퀴즈 삭제 중 오류가 발생했습니다.");
    });
}
