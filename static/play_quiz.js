document.addEventListener('DOMContentLoaded', function() {
    const quizTitle = document.querySelector('#quizTitle').getAttribute('data-quiz-title');
    console.log("quizTitle:", quizTitle);  // 제목 확인용

    function fetchQuizData() {
        fetch(`/get_quizzes?title=${quizTitle}`)
            .then(response => response.json())
            .then(data => {
                console.log("서버에서 받은 데이터:", data);  // 서버에서 받은 데이터 확인

                if (data.success) {
                    const quizzes = data.quizzes;  // 여러 퀴즈
                    let currentQuizIndex = 0;  // 첫 번째 퀴즈부터 시작

                    // 퀴즈가 여러 개일 때 각 퀴즈 처리
                    function displayQuiz(quizData) {
                        let currentQuestionIndex = 0;  // 첫 번째 질문부터 시작

                        // 첫 번째 질문을 표시하는 함수
                        function renderQuestion() {
                            console.log("렌더링 중, 현재 질문 인덱스:", currentQuestionIndex);  // 현재 질문 인덱스 확인

                            if (currentQuestionIndex < quizData.questions.length) {  // 질문이 남아있을 경우
                                const currentQuestion = quizData.questions[currentQuestionIndex];

                                // 기존 질문 지우기
                                const questionContainer = document.querySelector('#questionContainer');
                                questionContainer.innerHTML = '';  // 기존 내용 비우기

                                // 새 질문을 HTML에 추가
                                const newQuestionContainer = document.createElement('div');
                                newQuestionContainer.classList.add('question');

                                const questionText = document.createElement('h3');
                                questionText.textContent = currentQuestion.question;

                                const answerInput = document.createElement('input');
                                answerInput.classList.add('answerInput');
                                answerInput.placeholder = "답을 입력하세요";

                                const submitAnswerBtn = document.createElement('button');
                                submitAnswerBtn.classList.add('submitAnswerBtn');
                                submitAnswerBtn.textContent = "답 제출";

                                const feedback = document.createElement('p');
                                feedback.classList.add('feedback');

                                newQuestionContainer.appendChild(questionText);
                                newQuestionContainer.appendChild(answerInput);
                                newQuestionContainer.appendChild(submitAnswerBtn);
                                newQuestionContainer.appendChild(feedback);

                                questionContainer.appendChild(newQuestionContainer);

                                // 답 제출 버튼 클릭 시
                                submitAnswerBtn.addEventListener('click', function() {
                                    const userAnswer = answerInput.value.trim();
                                    const correctAnswer = currentQuestion.answer.trim();

                                    if (userAnswer === correctAnswer) {
                                        feedback.textContent = '정답입니다!';
                                        // 정답 시 자동으로 다음 질문으로 넘어감
                                        currentQuestionIndex++;  // 인덱스 증가
                                        setTimeout(renderQuestion, 1000);  // 1초 후에 다음 질문 렌더링
                                    } else {
                                        feedback.textContent = '틀렸습니다. 다시 시도하세요.';
                                    }
                                });
                            } else {
                                // 질문이 모두 끝났을 경우, 다음 퀴즈로 넘어가기
                                currentQuizIndex++;  // 다음 퀴즈로 이동
                                if (currentQuizIndex < quizzes.length) {
                                    displayQuiz(quizzes[currentQuizIndex]);  // 다음 퀴즈 렌더링
                                } else {
                                    alert("모든 퀴즈를 완료했습니다.");
                                    window.location.href = "/category";
                                }
                            }
                        }

                        renderQuestion();  // 첫 번째 질문부터 렌더링
                    }

                    // 첫 번째 퀴즈 표시
                    if (quizzes.length > 0) {
                        displayQuiz(quizzes[currentQuizIndex]);  // 첫 번째 퀴즈 표시
                    }
                } else {
                    alert(data.error);  // 에러 처리
                }
            })
            .catch(error => {
                console.error(error);  // 에러 로깅
                alert("퀴즈 데이터를 가져오는 데 문제가 발생했습니다.");
            });
    }

    fetchQuizData();  // 퀴즈 데이터를 가져와서 시작
});
