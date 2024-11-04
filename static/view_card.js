const cardContent = document.getElementById('cardContent');
const deleteCardBtn = document.getElementById('deleteCardBtn');
const saveChangesBtn = document.getElementById('saveChangesBtn');

// 카드 제목 가져오기
const urlParams = new URLSearchParams(window.location.search);
const cardTitle = urlParams.get('title');

// 카드 데이터를 서버에서 불러오기
window.addEventListener('DOMContentLoaded', () => {
    fetch(`/get_card?title=${encodeURIComponent(cardTitle)}`)
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
    cardContent.innerHTML = `
        <textarea placeholder="내용 입력" oninput="autoResize(this)">${card.content}</textarea>
    `;
}z

// 카드 삭제 기능
deleteCardBtn.addEventListener('click', () => {
    fetch(`/delete_card?title=${encodeURIComponent(cardTitle)}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("카드가 삭제되었습니다!");
            window.location.href = '/edit_card'; // 성공 시 카드 편집 페이지로 이동
        } else {
            alert("삭제 중 문제가 발생했습니다: " + data.error);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("삭제 중 문제가 발생했습니다.");
    });
});

// 변경 사항 저장 기능
saveChangesBtn.addEventListener('click', () => {
    const content = cardContent.querySelector('textarea').value;

    fetch(`/update_card`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: cardTitle, content: content })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("변경 사항이 저장되었습니다!");
        } else {
            alert("저장 중 문제가 발생했습니다: " + data.error);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("저장 중 문제가 발생했습니다.");
    });
});
