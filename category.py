from flask import Blueprint, render_template, session

category_bp = Blueprint('category', __name__, url_prefix='/category')

# 카테고리 페이지 라우트 (로그인 후 접근 가능)
@category_bp.route('/')
def category():
    return render_template('category.html')  # 카테고리 페이지 렌더링
