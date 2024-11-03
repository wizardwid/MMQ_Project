const editCardsContainer = document.getElementById('editCardsContainer');
const saveChangesBtn = document.getElementById('saveChangesBtn');

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
        cardDiv.className = 'card';
        cardDiv.innerHTML = `
            <input type="text" placeholder="제목 입력" value="${card.title}" />
            <textarea placeholder="내용 입력">${card.content}</textarea>
            <div class="button-container">
                <button type="button" class="viewButton">내용 보기</button>
            </div>
        `;
        editCardsContainer.appendChild(cardDiv);

        // 내용 보기 버튼 클릭 이벤트
        cardDiv.querySelector('.viewButton').addEventListener('click', () => {
            alert(`제목: ${card.title}\n내용: ${card.content}`);
        });
    });
}

// 변경 사항 저장 함수
saveChangesBtn.addEventListener('click', () => {
    const updatedCards = [...editCardsContainer.children].map(cardDiv => {
        return {
            title: cardDiv.querySelector('input').value,
            // 내용은 변경할 수 없도록 설정
        };
    });

    fetch('/save_updated_titles', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cards: updatedCards })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("변경 사항이 저장되었습니다.");
            } else {
                alert("변경 사항 저장에 실패했습니다: " + data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("변경 사항 저장 중 오류가 발생했습니다.");
        });
});
