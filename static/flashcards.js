// JavaScript 파일: flashcards.js

// 모달 관련 요소 가져오기
const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const cardTitleInput = document.getElementById('cardTitle'); // ID를 'cardTitle'로 설정
const settingButton = document.getElementById('setting'); // ID를 'setting'으로 변경
const cardsContainer = document.getElementById('cardsContainer');

// 페이지 제목 업데이트 요소
const pageTitle = document.querySelector('.title');

// 페이지 로드 시 모달 자동 표시
window.addEventListener('DOMContentLoaded', () => {
    modal.style.display = "block";
});

// 모달 닫기
span.onclick = function() {
    modal.style.display = "none";
};
window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

// 제목 설정 버튼 클릭 시 페이지 상단 제목 설정 및 첫 카드 생성
settingButton.onclick = function() { // settingButton에 맞춰 수정
    const title = cardTitleInput.value.trim(); // 공백 제거
    if (title) {
        pageTitle.textContent = title; // 페이지 상단 제목 업데이트
        modal.style.display = "none"; // 모달 닫기
        createCard(); // 첫 카드 생성
        cardTitleInput.value = ''; // 제목 입력 필드 초기화
    } else {
        alert("제목을 입력해 주세요."); // 빈 제목에 대한 경고
    }
};

// 카드 생성 함수
function createCard() {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.innerHTML = `
        <textarea placeholder="내용 입력" oninput="autoResize(this)"></textarea>
        <div class="button-container"> <!-- 버튼을 감싸는 div 추가 -->
            <button type="submit" class="deleteButton">삭제</button>
            <button type="submit" class="addCardButton">추가</button>
        </div>
    `;

    // 카드 컨테이너에 추가
    cardsContainer.appendChild(cardDiv);

    // 삭제 버튼 클릭 시 카드 삭제
    cardDiv.querySelector('.deleteButton').addEventListener('click', function() {
        cardDiv.remove();
    });

    // 카드 추가 버튼 클릭 시 카드 추가
    cardDiv.querySelector('.addCardButton').addEventListener('click', function() {
        createCard(); // 새로운 카드 생성
    });
}

// 입력 필드 자동 크기 조정
function autoResize(input) {
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
}
