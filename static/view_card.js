const settingButton = document.getElementById('setting'); 
const cardsContainer = document.getElementById('cardsContainer');
const saveBtn = document.getElementById('savebtn');

// 카드 제목 가져오기
const urlParams = new URLSearchParams(window.location.search);
const cardTitle = urlParams.get('title');

function loadCard(card) {
    // 카드 제목과 내용을 화면에 추가
    const titleElement = document.createElement('h2'); // 카드 제목을 위한 요소 생성
    titleElement.textContent = card.title; // 제목 설정

    const contentElement = document.createElement('p'); // 카드 내용을 위한 요소 생성
    contentElement.textContent = card.content; // 내용 설정

    // cardsContainer에 카드 제목과 내용을 추가
    cardsContainer.appendChild(titleElement);
    cardsContainer.appendChild(contentElement);
}


// 카드 데이터를 서버에서 불러오기
window.addEventListener('DOMContentLoaded', () => {
    const cardId = urlParams.get('id'); // 카드 ID 가져오기

    fetch(`/flashcard/${encodeURIComponent(cardId)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadCard(data.card); // 카드 데이터를 화면에 로드
            } else {
                alert("카드를 불러오는 데 문제가 발생했습니다: " + data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("카드를 불러오는 데 문제가 발생했습니다.");
        });
});


// 카드 로드 함수
function loadCard(card) {
    // 기존 카드가 있다면, 기존 내용을 채우고 새 카드를 생성
    if (card) {
        createCard(card.content);
    } else {
        createCard(); // 카드 내용이 없으면 빈 카드 생성
    }
}

// 카드 생성 함수
function createCard(content = '') {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    
    // 카드 내용 구성
    cardDiv.innerHTML = `
        <textarea placeholder="내용 입력" oninput="autoResize(this)">${content}</textarea>
        <div class="button-container">
            <button type="button" class="deleteButton">삭제</button>
            <button type="button" class="addCardButton">추가</button>
        </div>
    `;

    cardsContainer.appendChild(cardDiv); // 카드 컨테이너에 카드 추가

    // 삭제 버튼 클릭 시 카드 삭제
    cardDiv.querySelector('.deleteButton').addEventListener('click', function() {
        cardDiv.remove();
    });

    // 추가 버튼 클릭 시 새로운 카드 생성
    cardDiv.querySelector('.addCardButton').addEventListener('click', function() {
        createCard();
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
        title: cardTitle, // 카드 제목을 가져옵니다.
        content: card.querySelector('textarea').value
    }));

    console.log("Sending cards:", cards);  // 데이터 출력하여 확인

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
