const cardTitleElement = document.getElementById('cardTitle');
const cardsContainer = document.getElementById('cardsContainer');
const saveBtn = document.getElementById('savebtn');
const playBtn = document.getElementById('playbtn');
const modal = document.getElementById("confirmationModal");
const playButton = document.getElementById("confirmPlay");
const editButton = document.getElementById("cancelPlay");
const closeButton = document.getElementsByClassName("close")[0];

// 카드 제목 가져오기
const cardTitle = cardTitleElement.textContent.trim();

if (!cardTitle) {
    alert("제목이 누락되었습니다.");
} else {
    // 제목에 맞는 카드 표시
    fetchCardData(cardTitle);
}

// 카드 데이터 가져오기
function fetchCardData(title) {
    fetch(`/get_cards?title=${encodeURIComponent(title)}`)  // 제목을 URL 쿼리로 전달
        .then(response => {
            if (!response.ok) {
                throw new Error("카드 데이터를 가져오는 데 문제가 발생했습니다: " + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                cardsContainer.innerHTML = ''; // 기존 카드들 제거하여 중복 방지
                const cards = data.cards;
                if (cards.length > 0) {
                    cards.forEach(card => displayCard(card)); // 제목에 맞는 카드만 표시
                } else {
                    alert("카드를 찾을 수 없습니다.");
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

// 카드 데이터 표시
function displayCard(card) {
    const cardDiv = createCardDiv(card.content, card.id);
    cardsContainer.appendChild(cardDiv);
}

// 카드 DIV 생성 함수
function createCardDiv(content, id = "") {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.id = id;  // 카드 ID 추가

    cardDiv.innerHTML = `
        <textarea placeholder="내용 입력" oninput="autoResize(this)" data-original-content="${content}">${content}</textarea>
        <div class="button-container">
            <button type="button" class="deleteButton">삭제</button>
            <button type="button" class="addCardButton">추가</button>
        </div>
    `;

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

    // 추가 버튼 클릭 시 새로운 빈 카드 생성
    cardDiv.querySelector('.addCardButton').addEventListener('click', function() {
        createCard(); 
    });

    return cardDiv;
}

// 빈 카드 추가 함수
function createCard() {
    const cardDiv = createCardDiv("");
    cardsContainer.appendChild(cardDiv); 
}

// 저장 버튼 클릭 시 카드 저장
saveBtn.addEventListener('click', function() {

    // 카드 내용 확인
    const textareas = cardsContainer.querySelectorAll('textarea');
    const contents = Array.from(textareas).map(textarea => {
        const cardDiv = textarea.closest('.card');
        const cardId = cardDiv.dataset.id || null;
        return { 
            id: cardId, 
            title: cardTitle, 
            content: textarea.value,
            originalContent: textarea.dataset.originalContent 
        }; 
    });

    // 변경된 카드가 있는지 확인
    const modifiedCards = contents.filter(card => 
        card.content.trim() !== "" && (card.id === null || card.content !== card.originalContent)  // 내용이 변경되었거나 새 카드인 경우
    );

    if (modifiedCards.length > 0) {
        // 데이터 저장
        fetch(`/save_cards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cards: modifiedCards
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("변경 사항이 저장되었습니다!");  // 변경된 카드가 있을 경우에만 알림
                fetchCardData(cardTitle);  // 저장 후 해당 제목에 맞는 카드만 새로 불러오기
            } else {
                alert("저장 중 문제가 발생했습니다: " + data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("저장 중 문제가 발생했습니다.");
        });
    } else {
        alert("변경 사항이 없습니다.");  // 변경된 카드가 없을 경우 알림
    }
});

// 플레이 버튼 클릭 시 모달 띄우기
playBtn.addEventListener('click', function() {
    const quizTitle = quizTitleElement ? quizTitleElement.textContent.trim() : '';  // 제목을 직접 가져옵니다
    if (quizTitle) {
        modal.style.display = "block";  // 모달 띄우기
    } else {
        alert("퀴즈 제목을 찾을 수 없습니다.");
    }
});

// '예' 버튼 클릭 시 play_card.html로 이동
playButton.addEventListener('click', function() {
    const cardTitle = cardTitleElement ? cardTitleElement.textContent.trim() : '';  // 제목을 직접 가져옵니다
    if (cardTitle) {
        window.location.href = `/play_card/${encodeURIComponent(cardTitle)}`;  // 제목을 URL 파라미터로 추가
        modal.style.display = "none";  // 모달 닫기
    } else {
        alert("퀴즈 제목을 찾을 수 없습니다.");
    }
});

// '아니오' 버튼 클릭 시 모달 닫기
editButton.addEventListener('click', function() {
    window.location.href = "/edit_card";
    modal.style.display = "none";  // 모달 닫기
});

// 모달 닫기 버튼 클릭 시 모달 닫기
closeButton.addEventListener('click', function() {
    modal.style.display = "none";
});

// 모달 외부 클릭 시 모달 닫기
window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
};
