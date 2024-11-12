from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session
from models import db, Quiz, User
from sqlalchemy import text

quiz_bp = Blueprint('quiz', __name__, url_prefix='/quiz')

@quiz_bp.route('/', methods=['GET', 'POST'])
def quiz():
    if 'user_id' not in session:
        return redirect(url_for('login'))  # 로그인되지 않은 경우 로그인 페이지로 리다이렉트

    user = User.query.filter_by(user_id=session['user_id']).first()
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404  # 사용자가 없는 경우

    if request.method == 'POST':
        try:
            data = request.get_json()
            title = data.get('title')
            questions = data.get('questions')

            if not questions:
                return jsonify({"success": False, "error": "Questions are required"}), 400

            if not title:
                return jsonify({"success": False, "error": "Quiz title is required"}), 400

            # Quiz 생성 및 저장
            new_quiz = Quiz(title=title, questions=questions, user_id=user.id)
            db.session.add(new_quiz)
            db.session.commit()

            return jsonify({"success": True, "message": "Quiz saved successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "error": str(e)}), 500
    else:
        quizzes = Quiz.query.filter_by(user_id=user.id).all()
        return render_template('quiz.html', quizzes=quizzes)


@quiz_bp.route('/save_quiz', methods=['POST'])
def save_quiz():
    if 'user_id' in session:
        user = User.query.filter_by(user_id=session['user_id']).first()
        quizzes_data = request.json.get('quizzes')  # 클라이언트에서 전달받은 퀴즈들

        # quizzes_data가 None이면 빈 리스트로 처리
        if quizzes_data is None:
            return jsonify({"success": False, "error": "퀴즈 데이터가 없습니다."}), 400

        try:
            for quiz_data in quizzes_data:
                quiz = Quiz.query.filter_by(id=quiz_data['id'], user_id=user.id).first()
                if quiz:
                    # 기존 퀴즈 업데이트
                    quiz.title = quiz_data['title']
                    quiz.questions = [{
                        "question": quiz_data['question'],
                        "answer": quiz_data['answer']
                    }]
                else:
                    # 새 퀴즈 추가
                    new_quiz = Quiz(
                        title=quiz_data['title'],
                        questions=[{"question": quiz_data['question'], "answer": quiz_data['answer']}],
                        user_id=user.id
                    )
                    db.session.add(new_quiz)

            db.session.commit()  # 트랜잭션 커밋
            return jsonify({"success": True})

        except Exception as e:
            db.session.rollback()  # 예외가 발생하면 롤백
            return jsonify({"success": False, "error": str(e)}), 500

    return jsonify({"success": False, "error": "로그인 필요"}), 401

@quiz_bp.route('/delete_quiz/<int:quiz_id>', methods=['DELETE'])
def delete_quiz(quiz_id):
    try:
        if 'user_id' not in session:
            return jsonify({"success": False, "error": "User not logged in."}), 401

        user = User.query.filter_by(user_id=session['user_id']).first()

        if not user:
            return jsonify({"success": False, "error": "User not found."}), 404

        # 해당 퀴즈 ID와 사용자 ID에 해당하는 퀴즈를 찾음
        quiz = Quiz.query.filter_by(id=quiz_id, user_id=user.id).first()

        if not quiz:
            return jsonify({"success": False, "error": "Quiz not found."}), 404

        db.session.delete(quiz)
        db.session.commit()

        return jsonify({"success": True, "message": "Quiz deleted successfully."}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@quiz_bp.route('/quiz/<int:quiz_id>')
def quiz_view(quiz_id):
    if 'user_id' in session:
        user = User.query.filter_by(user_id=session['user_id']).first()
        quiz = Quiz.query.filter_by(id=quiz_id, user_id=user.id).first()
        if quiz:
            return render_template('view_quiz.html', title=quiz.title, questions=quiz.questions)  # 퀴즈 내용 렌더링
        return "Quiz not found", 404  # 퀴즈가 없는 경우
    return redirect(url_for('login'))  # 로그인되지 않은 경우 로그인 페이지로 리다이렉트

@quiz_bp.route('/edit_quiz')
def edit_quiz():
    if 'user_id' in session:
        return render_template('edit_quiz.html')  # 퀴즈 수정 페이지 렌더링
    return redirect(url_for('login'))  # 로그인되지 않은 경우 로그인 페이지로 리다이렉트

@quiz_bp.route('/get_quizzes', methods=['GET'])
def get_quizzes():
    title = request.args.get('title')  # 제목 파라미터를 요청에서 받음
    if 'user_id' in session:
        user = User.query.filter_by(user_id=session['user_id']).first()
        if title:
            # 특정 제목에 해당하는 퀴즈만 가져오기
            quizzes = Quiz.query.filter_by(user_id=user.id, title=title).all()
        else:
            # 제목이 주어지지 않으면 모든 퀴즈 가져오기
            quizzes = Quiz.query.filter_by(user_id=user.id).all()

        # 가져온 퀴즈 목록을 JSON 형식으로 반환
        return jsonify({
            "success": True,
            "quizzes": [{
                "id": quiz.id,
                "title": quiz.title,
                "questions": quiz.questions  # questions는 리스트 형태
            } for quiz in quizzes]
        })
    return jsonify({"success": False, "error": "로그인 필요"})

@quiz_bp.route('/save_updated_titles_quiz', methods=['POST'])
def save_updated_titles_quiz():
    data = request.get_json()
    title = data.get('title')  # 기존 제목
    updated_title = data.get('updatedTitle')  # 새로운 제목

    if not title or not updated_title:
        return jsonify({'success': False, 'error': '제목이 제공되지 않았습니다.'})

    try:
        # 제목을 가진 모든 퀴즈의 제목을 업데이트
        query = text('UPDATE quiz SET title = :updated_title WHERE title = :title')
        db.session.execute(query, {'updated_title': updated_title, 'title': title})

        # 데이터베이스에 변경 사항 저장
        db.session.commit()

        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@quiz_bp.route('/delete_quizzes_by_title', methods=['DELETE'])
def delete_quizzes_by_title():
    try:
        if 'user_id' not in session:
            return jsonify({"success": False, "error": "User not logged in."}), 401

        user = User.query.filter_by(user_id=session['user_id']).first()
        title = request.json.get('title')  # 삭제할 퀴즈의 제목을 받음

        if not title:
            return jsonify({"success": False, "error": "Title is required."}), 400

        # 해당 제목에 속하는 퀴즈들을 삭제
        quizzes = Quiz.query.filter(Quiz.title == title, Quiz.user_id == user.id).all()

        if quizzes:
            for quiz in quizzes:
                db.session.delete(quiz)
            db.session.commit()
            return jsonify({"success": True, "message": f"Quizzes with title '{title}' deleted successfully."}), 200
        else:
            return jsonify({"success": False, "error": "Quizzes with the given title not found."}), 404
    except Exception as e:
        # 예외가 발생한 경우 상세한 오류 메시지 출력
        print(f"Error while deleting quizzes: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred while processing the request."}), 500

@quiz_bp.route('/play_quiz/<title>', methods=['GET'])
def play_quiz(title):
    if 'user_id' in session:
        user = User.query.filter_by(user_id=session['user_id']).first()
        if user:
            quiz = Quiz.query.filter_by(title=title).first()
            if quiz:
                return render_template('play_quiz.html', quiz_title=quiz.title, quiz_id=quiz.id, questions=quiz.questions)
            else:
                return f"제목 '{title}'에 해당하는 퀴즈를 찾을 수 없습니다.", 404
        return redirect(url_for('login'))
    return redirect(url_for('login'))
