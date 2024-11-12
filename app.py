import os
from flask import Flask, render_template, request, redirect, url_for, session
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from models import db, User, Flashcard
from flashcard import flashcard_bp  # flashcard.py에서 블루프린트 임포트
from quiz import quiz_bp  # flashcard.py에서 블루프린트 임포트
from user import user_bp  # user.py에서 블루프린트 임포트
from category import category_bp  # category.py에서 블루프린트 임포트

# Flask 애플리케이션 설정
app = Flask(__name__)
app.secret_key = 'your_secret_key'

# 데이터베이스 초기화
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///your_database.db'
db.init_app(app)

# 블루프린트 등록
app.register_blueprint(flashcard_bp, url_prefix='/flashcard')  # 플래시카드 블루프린트
app.register_blueprint(quiz_bp, url_prefix='/quiz')  # 퀴즈 블루프린트
app.register_blueprint(user_bp, url_prefix='/user')  # 사용자 관련 블루프린트
app.register_blueprint(category_bp, url_prefix='/category')  # 카테고리 블루프린트

# Flask-Admin 설정
admin = Admin(app, name='MyApp', template_mode='bootstrap3')
admin.add_view(ModelView(User, db.session))
admin.add_view(ModelView(Flashcard, db.session))

if __name__ == '__main__':
    app.run(debug=True)
