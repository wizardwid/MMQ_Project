const editCardsContainer = document.getElementById('editCardsContainer');
const modal = document.getElementById("editModal");
const newTitleInput = document.getElementById('newTitle');
const saveTitleBtn = document.getElementById('saveTitleBtn');
const closeModal = document.getElementById('closeModal');

let currentEditingCardId = null;
let currentEditingCardTitle = null;  // 현재 수정 중인 제목 저장
let cards = [];  // 현재 페이지에서 사용 중인 카드 데이터

// 카드 데이터 불러오기
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM 완전 로드됨");
    fetch('/get_cards')
        .then(response => response.json())
        .then(data => {
            console.log("카드 데이터:", data);  // 받아온 데이터 출력
            if (data.success) {
                cards = data.cards;  // 카드를 받아서 cards 배열에 저장
                loadCards(cards);
            } else {
                alert("카드를 불러오는 데 문제가 발생했습니다: " + data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("카드를 불러오는 데 문제가 발생했습니다.");
        });
});

function loadCards(cards) {
    // 제목별로 카드들을 그룹화
    const groupedCards = {};  // 제목별로 카드 내용을 묶을 객체

    cards.forEach(card => {
        if (!groupedCards[card.title]) {
            groupedCards[card.title] = [];  // 제목이 처음 나오면 배열 초기화
        }
        groupedCards[card.title].push(card);  // 같은 제목의 카드들을 배열에 추가
    });

    // 기존 카드 컨테이너 비우기
    editCardsContainer.innerHTML = '';

    // 그룹화된 카드 내용 렌더링
    Object.keys(groupedCards).forEach(title => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-container';
        cardDiv.dataset.title = title;
        const cardsForThisTitle = groupedCards[title]; // 해당 제목에 속하는 카드들
        cardDiv.innerHTML = `
            <div class="card-title">${title}  
                <div class="icon-container">
                    <span class="edit-icon" data-id="${cardsForThisTitle[0].id}">&#9998;</span>  <!-- 편집 아이콘 -->
                    <span class="delete-icon" data-title="${title}">&#128465;</span>  <!-- 삭제 아이콘 -->
                 </div>
            </div>  
            <div class="card-content" style="display: none;">  
                ${cardsForThisTitle.map(card => ` 
                    <div class="card-item">
                        <input type="checkbox" class="card-checkbox" data-id="${card.id}" />
                        <span>${card.content}</span>
                    </div>
                `).join('')}
            </div>
        `;
        editCardsContainer.appendChild(cardDiv);

        // 제목 클릭 시 페이지 이동 (수정 및 삭제와 충돌을 피하기 위해서)
        cardDiv.querySelector('.card-title').addEventListener('click', (e) => {
            if (!e.target.classList.contains('edit-icon') && !e.target.classList.contains('delete-icon')) {
                const cardId = cardsForThisTitle[0].id;
                window.location.href = `/flashcard/${cardId}`;  // 해당 카드 ID로 이동
            }
        });

        // 수정 아이콘 클릭 시 모달 열기
        cardDiv.querySelector('.edit-icon').addEventListener('click', (e) => {
            e.stopPropagation();  // 제목 클릭 이벤트가 실행되지 않도록 막기
            currentEditingCardId = cardsForThisTitle[0].id; // 첫 번째 카드의 ID로 설정
            currentEditingCardTitle = title; // 해당 제목을 currentEditingCardTitle에 저장
            newTitleInput.value = title; // 해당 제목을 모달에 띄움
            modal.style.display = "block"; // 모달을 표시
            console.log("모달 열림: ", currentEditingCardId);  // 모달이 열리는지 확인
        });

        // 삭제 아이콘 클릭 시 해당 제목에 속한 카드들 삭제
        cardDiv.querySelector('.delete-icon').addEventListener('click', (e) => {
            const title = e.target.dataset.title;  // 삭제할 제목을 가져옴
            if (confirm(`정말로 '${title}' 제목의 카드를 삭제하시겠습니까?`)) {
                deleteCardsByTitle(title, cardDiv);  // 해당 제목의 카드들 삭제
            }
        });
    });
}

// 모달 닫기 이벤트
closeModal.addEventListener('click', () => {
    console.log("모달 닫기 클릭됨");
    modal.style.display = 'none';  // 수정
    currentEditingCardId = null;
    currentEditingCardTitle = null;  // 수정 중인 제목 초기화
});

// 제목 저장 버튼 클릭 이벤트
saveTitleBtn.addEventListener('click', () => {
    const updatedTitle = newTitleInput.value.trim();
    if (updatedTitle && updatedTitle !== currentEditingCardTitle) {
        fetch('/save_updated_titles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: currentEditingCardTitle, updatedTitle: updatedTitle })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // DOM에서 제목을 업데이트하고 모달을 닫음
                const cardTitles = document.querySelectorAll(`.card-container .card-title[data-title="${currentEditingCardTitle}"]`);
                cardTitles.forEach(cardTitle => {
                    cardTitle.textContent = updatedTitle;  // 제목 수정
                    cardTitle.innerHTML = `${updatedTitle}  
                        <span class="edit-icon" data-id="${cardTitle.dataset.id}">&#9998;</span>
                        <span class="delete-icon" data-id="${cardTitle.dataset.id}">&#128465;</span>
                    `; // 기존 아이콘 제거 후 새로 추가
                });
                modal.style.display = 'none';  // 모달을 닫음
                alert("제목이 수정되었습니다.");
                fetchCards();  // 카드 목록 갱신
            } else {
                alert("제목 수정에 실패했습니다: " + data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("제목 수정 중 오류가 발생했습니다.");
        });
    }
});


// 카드 목록을 새로 요청하여 갱신
function fetchCards() {
    fetch('/get_cards')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                cards = data.cards;
                loadCards(cards);
            } else {
                alert("카드 목록 갱신에 문제가 발생했습니다: " + data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("카드 목록을 갱신하는 데 문제가 발생했습니다.");
        });
}

// 제목에 속한 카드들 삭제 함수
function deleteCardsByTitle(title, cardDiv) {
    fetch('/delete_cards_by_title', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title })  // 제목을 전송
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`'${title}' 제목의 카드들이 삭제되었습니다.`);
            cardDiv.remove();  // 해당 제목에 속한 카드들을 DOM에서 삭제
            fetchCards();  // 카드 목록을 새로 요청하여 갱신
        } else {
            alert("카드 삭제에 실패했습니다: " + data.error);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("카드 삭제 중 오류가 발생했습니다.");
    });
}
