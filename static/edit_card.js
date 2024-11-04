const editCardsContainer = document.getElementById('editCardsContainer');
const editModal = document.getElementById('editModal');
const newTitleInput = document.getElementById('newTitle');
const saveTitleBtn = document.getElementById('saveTitleBtn');
const closeModal = document.getElementById('closeModal');

let currentEditingCardId = null;

// 카드 데이터 불러오기
window.addEventListener('DOMContentLoaded', () => {
    fetch('/get_cards')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadCards(data.cards);
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
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-container';
        cardDiv.dataset.id = card.id;
        cardDiv.innerHTML = `
            <span class="card-title">${card.title}</span>
            <span class="edit-icon" data-id="${card.id}">&#9998;</span>
            <span class="delete-icon" data-id="${card.id}">&#128465;</span>
        `;
        editCardsContainer.appendChild(cardDiv);

        // 제목 클릭 시 flashcards.html 페이지로 이동
        cardDiv.querySelector('.card-title').addEventListener('click', () => {
            window.location.href = `/flashcard/${card.id}`;
        });

        // 연필 아이콘 클릭 시 모달 열기
        cardDiv.querySelector('.edit-icon').addEventListener('click', (e) => {
            currentEditingCardId = e.target.dataset.id;
            newTitleInput.value = card.title;
            editModal.style.display = 'block';
        });

        // 쓰레기통 아이콘 클릭 시 카드 삭제
        cardDiv.querySelector('.delete-icon').addEventListener('click', (e) => {
            const cardId = e.target.dataset.id;
            deleteCard(cardId, cardDiv);
        });
    });
}

// 모달 닫기 이벤트
closeModal.addEventListener('click', () => {
    editModal.style.display = 'none';
    currentEditingCardId = null;
});

// 제목 저장 버튼 클릭 이벤트
saveTitleBtn.addEventListener('click', () => {
    const updatedTitle = newTitleInput.value.trim();
    if (currentEditingCardId && updatedTitle) {
        fetch('/save_updated_titles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cards: [{ id: currentEditingCardId, title: updatedTitle }] })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // DOM에서 제목을 업데이트하고 모달을 닫음
                const cardTitle = document.querySelector(`.card-container[data-id="${currentEditingCardId}"] .card-title`);
                cardTitle.textContent = updatedTitle;
                editModal.style.display = 'none';
                alert("제목이 수정되었습니다.");
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

// 카드 삭제 함수
function deleteCard(cardId, cardDiv) {
    fetch(`/delete_card/${cardId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                cardDiv.remove();  // DOM에서 카드 제거
                alert("카드가 삭제되었습니다.");
            } else {
                alert("카드 삭제에 실패했습니다: " + data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("카드 삭제 중 오류가 발생했습니다.");
        });
}
