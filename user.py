from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

user_bp = Blueprint('user', __name__, url_prefix='/user')

# 회원가입 라우트
@user_bp.route('/signup', methods=['GET', 'POST'])
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
            return redirect(url_for('user.login'))
        except Exception as e:
            db.session.rollback()
            return "Error occurred during sign up. Please try again.", 500  # 가입 중 오류 발생

    return render_template('join.html')  # GET 요청 시 가입 페이지 렌더링

# 로그인 라우트
@user_bp.route('/login', methods=['GET', 'POST'])
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

# 사용자 프로필 페이지 라우트
@user_bp.route('/profile')
def user_profile():
    return render_template('user.html')

# 로그아웃 라우트
@user_bp.route('/logout')
def logout():
    session.pop('user_id', None)  # 세션에서 사용자 ID 제거
    return redirect(url_for('home'))  # 홈 페이지로 리다이렉트

# 프로필 정보 가져오기 라우트
@user_bp.route('/get-profile', methods=['GET'])
def get_profile():
    user_info = {
        'name': session.get('user_name', 'MMQ'),
        'email': session.get('user_email', 'MMQ@gmail.com'),
        'profilePicture': session.get('profile_picture', '/static/default.jpg')
    }
    return jsonify(user_info)

# 프로필 업데이트 라우트
@user_bp.route('/update-profile', methods=['POST'])
def update_profile():
    data = request.get_json()
    session['user_name'] = data.get('name', session.get('user_name'))
    session['user_email'] = data.get('email', session.get('user_email'))
    return jsonify(success=True)
