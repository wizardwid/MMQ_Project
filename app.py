from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from models import db, User, Flashcard  # models.py에서 가져오기

# Flask 애플리케이션 설정
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'your_secret_key'

# 데이터베이스 초기화
db.init_app(app)

# Flask-Admin 설정
admin = Admin(app)
admin.add_view(ModelView(User, db.session))

# 앱 실행 시 데이터베이스 테이블 생성
with app.app_context():
    db.create_all()

@app.route('/')
def home():
    if 'user_id' in session:
        return redirect(url_for('category'))  # 로그인 상태이면 카테고리 페이지로 이동
    return render_template('index.html')  # 로그인하지 않은 경우 인덱스 페이지로 이동

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        user_id = request.form['id']
        password = request.form['passwd']
        confirm_password = request.form['cpasswd']

        if password != confirm_password:
            return "Passwords do not match. Please try again."

        existing_user = User.query.filter_by(user_id=user_id).first()
        if existing_user:
            return "This user ID already exists. Please try a different one."

        new_user = User(user_id=user_id, password=password)
        db.session.add(new_user)
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Error occurred: {e}")
            return "Error occurred during sign up. Please try again.", 500

        session['user_id'] = new_user.user_id
        return redirect(url_for('home'))

    return render_template('join.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user_id = request.form['uid']
        user_password = request.form['upasswd']

        user = User.query.filter_by(user_id=user_id).first()

        if user and user.password == user_password:
            session['user_id'] = user.user_id
            return redirect(url_for('category'))  # 로그인 성공 시 category로 이동
        else:
            return "Login failed. Please check your ID and password."

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('home'))

@app.route('/category')
def category():
    if 'user_id' in session:
        return render_template('category.html')
    return redirect(url_for('login'))

@app.route('/flashcards', methods=['GET', 'POST'])
def flashcards():
    if 'user_id' in session:
        if request.method == 'POST':
            title = request.form['title']
            content = request.form['content']
            new_card = Flashcard(title=title, content=content, user_id=session['user_id'])
            db.session.add(new_card)
            db.session.commit()
            return redirect(url_for('flashcards'))
        return render_template('flashcards.html')
    return redirect(url_for('login'))

@app.route('/create_card', methods=['POST'])
def create_card():
    if 'user_id' not in session:
        return jsonify({"error": "로그인이 필요합니다."}), 401

    data = request.json
    title = data.get('title', '')
    content = data.get('content', '')

    if not title or not content:
        return jsonify({"error": "제목과 내용을 입력해야 합니다."}), 400

    new_card = Flashcard(title=title, content=content, user_id=session['user_id'])
    db.session.add(new_card)
    db.session.commit()
    return jsonify({"message": "카드가 추가되었습니다!"})

if __name__ == '__main__':
    app.run(debug=True)