document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logout');
    const editButton = document.querySelector('.edit-button');
    const userNameDisplay = document.getElementById('userName');
    const userEmailDisplay = document.getElementById('userEmail');
    const saveChangesButton = document.getElementById('saveChanges');
    const profilePicture = document.getElementById('profilePicture');
    const imageUpload = document.getElementById('imageUpload');
    const editModal = document.getElementById('editModal');
    const closeModalButton = document.getElementById('closeModal');

    // 사용자 정보를 서버에서 가져오는 함수
    function loadUserProfile() {
        fetch('/get-profile')
        .then(response => response.json())
        .then(data => {
            userNameDisplay.textContent = data.name;
            userEmailDisplay.textContent = data.email;
            profilePicture.src = data.profilePicture;
        })
        .catch(error => {
            console.error('사용자 정보 로드 실패:', error);
        });
    }

    // 페이지 로드 시 사용자 정보 불러오기
    loadUserProfile();

    // 프로필 이미지 업로드 핸들러
    profilePicture.addEventListener('click', function() {
        imageUpload.click();
    });

    imageUpload.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profilePicture.src = e.target.result; // 선택한 이미지로 프로필 사진 업데이트
            };
            reader.readAsDataURL(file);
        }
    });

    // 로그아웃 기능
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            window.location.href = '/logout';
        });
    }

    // 편집 버튼 클릭 시 모달 열기
    if (editButton) {
        editButton.addEventListener('click', function() {
            editModal.style.display = 'flex';
            document.getElementById('editName').value = userNameDisplay.textContent;
            document.getElementById('editEmail').value = userEmailDisplay.textContent;
        });
    }

    // 변경사항 저장 버튼 클릭 시
    if (saveChangesButton) {
        saveChangesButton.addEventListener('click', function() {
            const newName = document.getElementById('editName').value;
            const newEmail = document.getElementById('editEmail').value;

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(newEmail)) {
                alert('유효한 이메일 주소를 입력해 주세요.');
                return;
            }

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
                    userNameDisplay.textContent = newName;
                    userEmailDisplay.textContent = newEmail;
                    editModal.style.display = 'none';
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
        editModal.style.display = 'none';
    });

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(event) {
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
    });
});
