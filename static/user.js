document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logout');

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            fetch('/logout', {
                method: 'POST'
            })
            .then(response => {
                if (response.ok) {
                    window.location.href = '/';
                } else {
                    console.error('로그아웃 실패');
                }
            })
            .catch(error => {
                console.error('에러 발생:', error);
            });
        });
    }
});


function toggleEditForm() {
    const form = document.getElementById('editForm');
    const isFormVisible = form.style.display === 'flex';
    form.style.display = isFormVisible ? 'none' : 'flex';

    if (!isFormVisible) {
        document.getElementById('editName').value = document.getElementById('userName').innerText;
        document.getElementById('editHeight').value = document.getElementById('userHeight').innerText.replace(' cm', '');
        document.getElementById('editWeight').value = document.getElementById('userWeight').innerText.replace(' kg', '');
    }
}

function previewImage(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function() {
        const output = document.getElementById('profileImg');
        output.src = reader.result;
    };
    if (file) {
        reader.readAsDataURL(file);
    }
}

function saveProfile() {
    const newName = document.getElementById('editName').value;
    const newHeight = document.getElementById('editHeight').value;
    const newWeight = document.getElementById('editWeight').value;

    document.getElementById('userName').innerText = newName;
    document.getElementById('userHeight').innerText = `${newHeight} cm`;
    document.getElementById('userWeight').innerText = `${newWeight} kg`;

    document.getElementById('editForm').style.display = 'none';
}
