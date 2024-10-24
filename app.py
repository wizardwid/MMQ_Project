from flask import Flask, render_template, request, redirect, url_for, session
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from models import db, User

app = Flask(__name__)

# 데이터베이스 설정
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 시크릿 키 설정
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
        return f"Hello, {session['user_id']}! Welcome back to My Memory Quiz."
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        user_id = request.form['id']
        password = request.form['passwd']
        confirm_password = request.form['cpasswd']

        # 비밀번호와 확인 비밀번호가 일치하는지 확인
        if password != confirm_password:
            return "Passwords do not match. Please try again."

        # 같은 아이디가 있는지 확인
        existing_user = User.query.filter_by(user_id=user_id).first()
        if existing_user:
            return "This user ID already exists. Please try a different one."

        # 새로운 유저 생성
        new_user = User(user_id=user_id, password=password)
        db.session.add(new_user)
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Error occurred: {e}")
            return "Error occurred during sign up. Please try again.", 500

        # 회원가입 성공 후 자동 로그인
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
            return redirect(url_for('home'))
        else:
            return "Login failed. Please check your ID and password."

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)
