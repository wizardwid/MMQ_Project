document.addEventListener('DOMContentLoaded', function() {
const logoutButton = document.getElementById('logout');
const editButton = document.querySelector('.edit-button');
const editForm = document.querySelector('.edit-form');
const userNameDisplay = document.getElementById('userName');
const userEmailDisplay = document.getElementById('userEmail');
const saveChangesButton = document.getElementById('saveChanges');
const profilePicture = document.getElementById('profilePicture');
const imageUpload = document.getElementById('imageUpload');
const editModal = document.getElementById('editModal');
const closeModalButton = document.getElementById('closeModal');

// 프로필 이미지 업로드 핸들러
profilePicture.addEventListener('click', function() {
    imageUpload.click(); // 이미지 파일 입력 필드를 클릭
});

imageUpload.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profilePicture.src = e.target.result; // 선택한 이미지로 프로필 사진 업데이트
        };
        reader.readAsDataURL(file); // 파일을 Data URL로 변환
    }
});

// 로그아웃 기능
if (logoutButton) {
logoutButton.addEventListener('click', function() {
    // 로그아웃 라우트로 리다이렉트
    window.location.href = '/logout';
});
}

// 편집 버튼 클릭 시 모달 열기
if (editButton) {
    editButton.addEventListener('click', function() {
        editModal.style.display = 'flex'; // 모달 표시
        document.getElementById('editName').value = userNameDisplay.textContent; // 현재 이름을 입력란에 표시
        document.getElementById('editEmail').value = userEmailDisplay.textContent; // 현재 이메일을 입력란에 표시
    });
}

// 변경사항 저장 버튼 클릭 시
if (saveChangesButton) {
    saveChangesButton.addEventListener('click', function() {
        const newName = document.getElementById('editName').value;
        const newEmail = document.getElementById('editEmail').value;

         // 이메일 형식 검증
         const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailPattern.test(newEmail)) {
             alert('유효한 이메일 주소를 입력해 주세요.'); // 유효하지 않은 경우 경고 메시지
             return; // 유효하지 않은 경우 함수 종료
         }

        // 서버에 사용자 정보 업데이트 요청
        fetch('/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: newName,
                email: newEmail
            })
        })
        .then(response => {
            if (response.ok) {
                // 성공적으로 업데이트된 경우, UI 업데이트
                userNameDisplay.textContent = newName;
                userEmailDisplay.textContent = newEmail;
                editModal.style.display = 'none'; // 모달 숨기기
            } else {
                console.error('프로필 업데이트 실패');
            }
        })
        .catch(error => {
            console.error('에러 발생:', error);
        });
    });
}

// 모달 닫기 기능
closeModalButton.addEventListener('click', function() {
    editModal.style.display = 'none'; // 모달 숨기기
});

// 모달 외부 클릭 시 닫기
window.addEventListener('click', function(event) {
    if (event.target === editModal) {
        editModal.style.display = 'none'; // 모달 숨기기
    }
});
});
