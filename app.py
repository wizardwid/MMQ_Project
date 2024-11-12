import os
from sqlalchemy import text
from flask import send_from_directory
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
import logging
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from models import db, User, Flashcard, Quiz  # models.py에서 임포트

# Flask 애플리케이션 설정
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'  # SQLite 데이터베이스 URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'your_secret_key'  # 세션 관리를 위한 비밀 키

# 데이터베이스 초기화
db.init_app(app)

# Flask-Admin 설정
admin = Admin(app, name='MyApp Admin', template_mode='bootstrap3')

# 앱 실행 시 데이터베이스 테이블 생성
with app.app_context():
    db.create_all()

# Admin 뷰 등록
admin.add_view(ModelView(User, db.session))
admin.add_view(ModelView(Flashcard, db.session))
admin.add_view(ModelView(Quiz, db.session))

# 나머지 라우트 및 핸들러 코드는 그대로 유지
@app.route('/')
def home():
    if 'user_id' in session:
        return redirect(url_for('category'))  # 로그인된 사용자라면 카테고리 페이지로 리다이렉트
    return render_template('index.html')  # 로그인되지 않은 경우 홈 페이지 렌더링

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        user_id = request.form['id']
        password = request.form['passwd']
        confirm_password = request.form['cpasswd']

        if password != confirm_password:
            return "Passwords do not match. Please try again.", 400  # 비밀번호 불일치

        existing_user = User.query.filter_by(user_id=user_id).first()
        if existing_user:
            return "This user ID already exists. Please try a different one.", 400  # 사용자 ID 중복

        new_user = User(user_id=user_id, password=generate_password_hash(password))
        db.session.add(new_user)
        try:
            db.session.commit()
            session['user_id'] = new_user.user_id  # 가입 후 세션에 사용자 ID 저장
            return redirect(url_for('login'))
        except Exception as e:
            db.session.rollback()
            return "Error occurred during sign up. Please try again.", 500  # 가입 중 오류 발생

    return render_template('join.html')  # GET 요청 시 가입 페이지 렌더링

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user_id = request.form['uid']
        user_password = request.form['upasswd']

        user = User.query.filter_by(user_id=user_id).first()
        if user and check_password_hash(user.password, user_password):
            session['user_id'] = user.user_id
            return redirect(url_for('category'))  # 로그인 성공 시 카테고리 페이지로 리다이렉트
        else:
            return "Login failed. Please check your ID and password.", 401  # 로그인 실패

    return render_template('login.html')  # GET 요청 시 로그인 페이지 렌더링

@app.route('/user')
def user_profile():
    return render_template('user.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)  # 세션에서 사용자 ID 제거
    return redirect(url_for('home'))  # 홈 페이지로 리다이렉트

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))  # 로그인되지 않은 경우 로그인 페이지로 리다이렉트
        return f(*args, **kwargs)  # 로그인된 사용자라면 원래 함수 실행
    return decorated_function

@app.route('/get-profile', methods=['GET'])
def get_profile():
    # 세션에서 사용자 정보 가져오기 (예시)
    user_info = {
        'name': session.get('user_name', 'MMQ'),  # 기본값 제공
        'email': session.get('user_email', 'MMQ@gmail.com'),  # 기본값 제공
        'profilePicture': session.get('profile_picture', '/static/default.jpg')  # 기본 이미지 제공
    }
    return jsonify(user_info)

@app.route('/update-profile', methods=['POST'])
def update_profile():
    data = request.get_json()
    session['user_name'] = data.get('name', session.get('user_name'))
    session['user_email'] = data.get('email', session.get('user_email'))
    # 프로필 사진 업데이트를 원하실 경우 추가 로직도 여기에 포함할 수 있습니다.
    return jsonify(success=True)

# 데코레이터 적용 예시
@app.route('/category')
@login_required  # 로그인된 사용자만 접근 가능
def category():
    return render_template('category.html')  # 카테고리 페이지 렌더링

@app.route('/flashcards', methods=['GET', 'POST'])
def flashcards():
    if 'user_id' in session:
        if request.method == 'POST':
            title = request.form['title']
            content = request.form['content']
            user = User.query.filter_by(user_id=session['user_id']).first()
            new_card = Flashcard(title=title, content=content, user_id=user.id)
            db.session.add(new_card)
            db.session.commit()
            return redirect(url_for('flashcards'))  # 플래시카드 생성 후 다시 플래시카드 페이지로 리다이렉트

        cards = Flashcard.query.filter_by(user_id=session['user_id']).all()  # 사용자에 해당하는 플래시카드 가져오기
        return render_template('flashcards.html', cards=cards)  # 플래시카드 페이지 렌더링
    return redirect(url_for('login'))  # 로그인되지 않은 경우 로그인 페이지로 리다이렉트

@app.route('/create_card', methods=['POST'])
def create_card():
    if 'user_id' in session:
        title = request.form['title']
        content = request.form['content']
        user = User.query.filter_by(user_id=session['user_id']).first()

        new_card = Flashcard(title=title, content=content, user_id=user.id)
        db.session.add(new_card)
        db.session.commit()

        return jsonify({"success": True, "message": "Card created successfully."}), 201  # 카드 생성 성공
    return jsonify({"success": False, "error": "User not logged in."}), 401  # 로그인되지 않은 경우

@app.route('/save_cards', methods=['POST'])
def save_cards():
    data = request.get_json()
    cards = data.get('cards', [])

    if not cards:
        return jsonify({"success": False, "error": "No cards to save."}), 400  # 저장할 카드가 없는 경우

    # 사용자 정보 확인
    user = User.query.filter_by(user_id=session.get('user_id')).first()
    if user is None:
        return jsonify({"success": False, "error": "User not found."}), 404  # 사용자가 존재하지 않는 경우

    try:
        for card in cards:
            new_card = Flashcard(
                title=card['title'],
                content=card['content'],
                user_id=user.id  # 이제 user는 None이 아닙니다
            )
            db.session.add(new_card)
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500  # 저장 중 오류 발생

@app.route('/delete_card/<int:card_id>', methods=['DELETE'])
def delete_card(card_id):
    try:
        if 'user_id' not in session:
            return jsonify({"success": False, "error": "User not logged in."}), 401

        user = User.query.filter_by(user_id=session['user_id']).first()

        if not user:
            return jsonify({"success": False, "error": "User not found."}), 404

        # 해당 카드 ID와 사용자 ID에 해당하는 카드를 찾음
        card = Flashcard.query.filter_by(id=card_id, user_id=user.id).first()

        if not card:
            return jsonify({"success": False, "error": "Card not found."}), 404

        db.session.delete(card)
        db.session.commit()

        return jsonify({"success": True, "message": "Card deleted successfully."}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/flashcard/<int:card_id>')
def flashcard_view(card_id):
    if 'user_id' in session:
        user = User.query.filter_by(user_id=session['user_id']).first()
        card = Flashcard.query.filter_by(id=card_id, user_id=user.id).first()
        if card:
            return render_template('view_card.html', title=card.title, content=card.content)  # 플래시카드 내용 렌더링
        return "Card not found", 404  # 카드가 없는 경우
    return redirect(url_for('login'))  # 로그인되지 않은 경우 로그인 페이지로 리다이렉트

@app.route('/edit_card')
def edit_card():
    if 'user_id' in session:
        return render_template('edit_card.html')  # 카드 수정 페이지 렌더링
    return redirect(url_for('login'))  # 로그인되지 않은 경우 로그인 페이지로 리다이렉트

@app.route('/get_cards', methods=['GET'])
def get_cards():
    title = request.args.get('title')  # 제목 파라미터를 요청에서 받음
    if 'user_id' in session:
        user = User.query.filter_by(user_id=session['user_id']).first()
        if title:
            # 특정 제목에 해당하는 카드만 가져오기
            cards = Flashcard.query.filter_by(user_id=user.id, title=title).all()
        else:
            # 제목이 주어지지 않으면 모든 카드 가져오기
            cards = Flashcard.query.filter_by(user_id=user.id).all()
        return jsonify({
            "success": True,
            "cards": [{"id": card.id, "title": card.title, "content": card.content} for card in cards]
        })
    return jsonify({"success": False, "error": "User not logged in."}), 401

@app.route('/save_updated_titles', methods=['POST'])
def save_updated_titles():
    data = request.get_json()
    title = data.get('title')  # 기존 제목
    updated_title = data.get('updatedTitle')  # 새로운 제목

    if not title or not updated_title:
        return jsonify({'success': False, 'error': '제목이 제공되지 않았습니다.'})

    try:
        # 제목을 가진 모든 카드의 제목을 업데이트
        query = text('UPDATE flashcard SET title = :updated_title WHERE title = :title')
        db.session.execute(query, {'updated_title': updated_title, 'title': title})

        # 데이터베이스에 변경 사항 저장
        db.session.commit()

        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/delete_cards_by_title', methods=['DELETE'])
def delete_cards_by_title():
    try:
        if 'user_id' not in session:
            return jsonify({"success": False, "error": "User not logged in."}), 401

        user = User.query.filter_by(user_id=session['user_id']).first()
        title = request.json.get('title')  # 삭제할 카드의 제목을 받음

        if not title:
            return jsonify({"success": False, "error": "Title is required."}), 400

        # 해당 제목에 속하는 카드들을 삭제
        cards = Flashcard.query.filter(Flashcard.title == title, Flashcard.user_id == user.id).all()

        if cards:
            for card in cards:
                db.session.delete(card)
            db.session.commit()
            return jsonify({"success": True, "message": f"Cards with title '{title}' deleted successfully."}), 200
        else:
            return jsonify({"success": False, "error": "Cards with the given title not found."}), 404
    except Exception as e:
        # 예외가 발생한 경우 상세한 오류 메시지 출력
        print(f"Error while deleting cards: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred while processing the request."}), 500

@app.route('/play_card/<title>', methods=['GET'])
def play_card(title):
    if 'user_id' in session:
        user = User.query.filter_by(user_id=session['user_id']).first()
        card = Flashcard.query.filter_by(title=title, user_id=user.id).first()
        if card:
            return render_template('play_card.html', card=card, title=card.title)
        else:
            return f"제목 '{title}'에 해당하는 카드를 찾을 수 없습니다.", 404
    return redirect(url_for('login'))

@app.route('/quiz', methods=['GET', 'POST'])
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


@app.route('/save_quiz', methods=['POST'])
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

@app.route('/delete_quiz/<int:quiz_id>', methods=['DELETE'])
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

@app.route('/quiz/<int:quiz_id>')
def quiz_view(quiz_id):
    if 'user_id' in session:
        user = User.query.filter_by(user_id=session['user_id']).first()
        quiz = Quiz.query.filter_by(id=quiz_id, user_id=user.id).first()
        if quiz:
            return render_template('view_quiz.html', title=quiz.title, questions=quiz.questions)  # 퀴즈 내용 렌더링
        return "Quiz not found", 404  # 퀴즈가 없는 경우
    return redirect(url_for('login'))  # 로그인되지 않은 경우 로그인 페이지로 리다이렉트

@app.route('/edit_quiz')
def edit_quiz():
    if 'user_id' in session:
        return render_template('edit_quiz.html')  # 퀴즈 수정 페이지 렌더링
    return redirect(url_for('login'))  # 로그인되지 않은 경우 로그인 페이지로 리다이렉트

@app.route('/get_quizzes', methods=['GET'])
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

@app.route('/save_updated_titles_quiz', methods=['POST'])
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

@app.route('/delete_quizzes_by_title', methods=['DELETE'])
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

@app.route('/play_quiz/<title>', methods=['GET'])
def play_quiz(title):
    if 'user_id' in session:
        user = User.query.filter_by(user_id=session['user_id']).first()
        if user:
            logging.debug(f"퀴즈 제목: {title}")  # 제목 출력
            quiz = Quiz.query.filter_by(title=title).first()
            if quiz:
                logging.debug(f"퀴즈 ID: {quiz.id}, 퀴즈 제목: {quiz.title}")  # 퀴즈 정보 출력
                return render_template('play_quiz.html', quiz_title=quiz.title, quiz_id=quiz.id, questions=quiz.questions)
            else:
                logging.debug(f"퀴즈 제목 '{title}'에 해당하는 퀴즈가 없습니다.")  # 제목이 없을 경우 로그 출력
                return f"제목 '{title}'에 해당하는 퀴즈를 찾을 수 없습니다.", 404
        return redirect(url_for('login'))
    return redirect(url_for('login'))

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico')

# 오류 핸들러 설정
@app.errorhandler(Exception)
def handle_exception(e):
    logging.exception("An error occurred: %s", e)
    return jsonify({"error": str(e)}), 500  # 오류 발생 시 JSON 형식으로 오류 반환

# 로깅 설정
logging.basicConfig(level=logging.INFO)

if __name__ == '__main__':
    app.run(debug=True)  # 디버그 모드에서 애플리케이션 실행