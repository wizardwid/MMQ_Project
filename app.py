from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
import logging
from werkzeug.security import generate_password_hash, check_password_hash

# 데이터베이스 초기화
db = SQLAlchemy()

# Flask 애플리케이션 설정
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'your_secret_key'

# 데이터베이스 초기화
db.init_app(app)

# Flask-Admin 설정
admin = Admin(app, name='MyApp Admin', template_mode='bootstrap3')

# 모델 정의
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

class Flashcard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    user = db.relationship('User', backref='flashcards')

# 앱 실행 시 데이터베이스 테이블 생성
with app.app_context():
    db.create_all()

# Admin 뷰 등록
admin.add_view(ModelView(User, db.session))
admin.add_view(ModelView(Flashcard, db.session))

@app.route('/')
def home():
    if 'user_id' in session:
        return redirect(url_for('category'))
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        user_id = request.form['id']
        password = request.form['passwd']
        confirm_password = request.form['cpasswd']

        if password != confirm_password:
            return "Passwords do not match. Please try again.", 400

        existing_user = User.query.filter_by(user_id=user_id).first()
        if existing_user:
            return "This user ID already exists. Please try a different one.", 400

        new_user = User(user_id=user_id, password=generate_password_hash(password))
        db.session.add(new_user)
        try:
            db.session.commit()
            session['user_id'] = new_user.user_id  # 가입 후 세션에 사용자 ID 저장
            return redirect(url_for('home'))
        except Exception as e:
            db.session.rollback()
            return "Error occurred during sign up. Please try again.", 500

    return render_template('join.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user_id = request.form['uid']
        user_password = request.form['upasswd']

        user = User.query.filter_by(user_id=user_id).first()
        if user and check_password_hash(user.password, user_password):
            session['user_id'] = user.user_id
            return redirect(url_for('category'))
        else:
            return "Login failed. Please check your ID and password.", 401

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
            user = User.query.filter_by(user_id=session['user_id']).first()
            new_card = Flashcard(title=title, content=content, user_id=user.id)
            db.session.add(new_card)
            db.session.commit()
            return redirect(url_for('flashcards'))

        cards = Flashcard.query.filter_by(user_id=session['user_id']).all()
        return render_template('flashcards.html', cards=cards)
    return redirect(url_for('login'))

@app.route('/create_card', methods=['POST'])
def create_card():
    if 'user_id' in session:
        title = request.form['title']
        content = request.form['content']
        user = User.query.filter_by(user_id=session['user_id']).first()

        new_card = Flashcard(title=title, content=content, user_id=user.id)
        db.session.add(new_card)
        db.session.commit()

        return jsonify({"success": True, "message": "Card created successfully."}), 201
    return jsonify({"success": False, "error": "User not logged in."}), 401

@app.route('/save_cards', methods=['POST'])
def save_cards():
    data = request.get_json()
    cards = data.get('cards', [])

    if not cards:
        return jsonify({"success": False, "error": "No cards to save."}), 400

    # 사용자 정보 확인
    user = User.query.filter_by(user_id=session.get('user_id')).first()
    if user is None:
        return jsonify({"success": False, "error": "User not found."}), 404

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
        return jsonify({"success": False, "error": str(e)}), 500


# 오류 핸들러 설정
@app.errorhandler(Exception)
def handle_exception(e):
    logging.exception("An error occurred: %s", e)
    return jsonify({"error": str(e)}), 500

# 로깅 설정
logging.basicConfig(level=logging.INFO)

if __name__ == '__main__':
    app.run(debug=True)