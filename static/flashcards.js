const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const cardTitleInput = document.getElementById('cardTitle'); 
const settingButton = document.getElementById('setting'); 
const cardsContainer = document.getElementById('cardsContainer');
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

// 제목 설정 버튼 클릭 시 페이지 상단 제목 설정 및 첫 카드 생성
settingButton.onclick = function() { 
    const title = cardTitleInput.value.trim(); 
    if (title) {
        pageTitle.textContent = title; // 페이지 제목 설정
        modal.style.display = "none"; // 모달 닫기
        createCard(); // 첫 카드 생성
        cardTitleInput.value = ''; // 입력 필드 초기화
    } else {
        alert("제목을 입력해 주세요."); // 제목이 비어 있을 경우 경고
    }
};

// 카드 생성 함수
function createCard() {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    
    // 카드 내용 구성
    cardDiv.innerHTML = `
        <textarea placeholder="내용 입력" oninput="autoResize(this)"></textarea>
        <div class="button-container">
            <button type="button" class="deleteButton">삭제</button>
            <button type="button" class="addCardButton">추가</button>
        </div>
    `;

    cardsContainer.appendChild(cardDiv); // 카드 컨테이너에 카드 추가

    // 삭제 버튼 클릭 시 카드 삭제
    cardDiv.querySelector('.deleteButton').addEventListener('click', function() {
        const cardId = cardDiv.dataset.id;
        if (cardId) {
            fetch(`/delete_card/${cardId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("카드가 성공적으로 삭제되었습니다.");
                    cardDiv.remove(); 
                } else {
                    alert("삭제 중 문제가 발생했습니다: " + data.error);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("삭제 중 문제가 발생했습니다.");
            });
        } else {
            cardDiv.remove(); 
        }
    });

    // 추가 버튼 클릭 시 새로운 카드 생성
    cardDiv.querySelector('.addCardButton').addEventListener('click', function() {
        createCard(); // 새 카드 추가
    });
}

// 입력 필드 자동 크기 조정
function autoResize(input) {
    input.style.height = 'auto'; // 초기화
    input.style.height = input.scrollHeight + 'px'; // 입력 내용에 맞게 높이 조정
}

// flashcards.js의 saveBtn 이벤트
saveBtn.addEventListener('click', function() {
    // 카드 내용 수집
    const cards = Array.from(cardsContainer.querySelectorAll('.card')).map(card => ({
        title: pageTitle.textContent,
        content: card.querySelector('textarea').value
    }));

    console.log("Sending cards:", cards);  // 데이터 확인용 출력

    // 서버에 카드 저장 요청
    fetch('/save_cards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cards }) // 카드 데이터를 JSON 형식으로 변환
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("카드가 성공적으로 저장되었습니다!");
            window.location.href = '/category'; // 성공 시 카테고리 페이지로 이동
        } else {
            alert("저장 중 문제가 발생했습니다: " + data.error);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("저장 중 문제가 발생했습니다.");
    });
});