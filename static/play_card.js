let currentCardIndex = 0;  // 현재 카드 인덱스
let flashcardData = [];  // 플래시카드 데이터를 저장할 배열

const flashcardTitle = document.getElementById("flashcardTitle");
const flashcardText = document.getElementById("flashcardText");
const nextCardBtn = document.getElementById("nextCard");
const prevCardBtn = document.getElementById("prevCard");

// 서버에서 카드를 가져오는 함수
function loadCards() {
    const title = new URLSearchParams(window.location.search).get('title');  // URL에서 'title' 파라미터 가져오기
    const url = title ? `/get_cards?title=${title}` : '/get_cards';  // 제목이 있을 경우에만 필터링

    console.log("Request URL:", url); // URL 로그 확인

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                flashcardData = data.cards;  // 가져온 카드를 flashcardData에 저장
                if (flashcardData.length > 0) {
                    currentCardIndex = 0;
                    loadCard();  // 첫 번째 카드 로드
                } else {
                    alert("카드가 없습니다.");
                }
            } else {
                alert(data.error || "카드 로드 실패");
            }
        })
        .catch(error => {
            console.error("Error fetching cards:", error);
            alert("카드를 불러오는 중 오류가 발생했습니다.");
        });
}

// 카드 데이터를 화면에 표시하는 함수
function loadCard() {
    if (flashcardData.length === 0) {
        flashcardTitle.innerHTML = "카드를 찾을 수 없습니다.";
        flashcardText.textContent = "";
        return;
    }
    
    const card = flashcardData[currentCardIndex];
    if (card) {
        flashcardTitle.innerHTML = `카드 제목: ${card.title || "제목 없음"}`;  // 카드 제목을 표시
        flashcardText.textContent = card.content || "내용이 없습니다.";  // 카드 내용을 표시
    } else {
        console.error(`Card at index ${currentCardIndex} not found.`);
    }
}

// 다음 카드로 넘어가기
function nextCard() {
    if (currentCardIndex < flashcardData.length - 1) {
        currentCardIndex++;
        loadCard();
    } else {
        finishCards();  // 모든 카드를 다 본 경우
    }
}

// 이전 카드로 돌아가기
function prevCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        loadCard();
    }
}

// 카드 완료
function finishCards() {
    alert("모든 카드를 완료했습니다!");
    window.location.href = '/'; // 홈 페이지로 리다이렉트
}

// "다음 카드" 아이콘 클릭 시
nextCardBtn.addEventListener('click', nextCard);

// "이전 카드" 아이콘 클릭 시
prevCardBtn.addEventListener('click', prevCard);

// 키보드 내비게이션
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {  // 오른쪽 화살표
        nextCard();
    } else if (event.key === 'ArrowLeft') {  // 왼쪽 화살표
        prevCard();
    }
});

// 첫 번째 카드 로드
loadCards();
