from flask import Blueprint, render_template, request, redirect, url_for, jsonify, session
from models import db, Flashcard, User
from sqlalchemy import text

flashcard_bp = Blueprint('flashcard', __name__)

@flashcard_bp.route('/flashcards', methods=['GET', 'POST'])
def flashcards():
    if 'user_id' in session:
        if request.method == 'POST':
            title = request.form['title']
            content = request.form['content']
            user = User.query.filter_by(user_id=session['user_id']).first()
            new_card = Flashcard(title=title, content=content, user_id=user.id)
            db.session.add(new_card)
            db.session.commit()
            return redirect(url_for('flashcard.flashcards'))  # 플래시카드 생성 후 다시 플래시카드 페이지로 리다이렉트

        cards = Flashcard.query.filter_by(user_id=session['user_id']).all()  # 사용자에 해당하는 플래시카드 가져오기
        return render_template('flashcards.html', cards=cards)  # 플래시카드 페이지 렌더링
    return redirect(url_for('user.login'))  # 로그인되지 않은 경우 로그인 페이지로 리다이렉트

@flashcard_bp.route('/create_card', methods=['POST'])
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

@flashcard_bp.route('/save_cards', methods=['POST'])
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

@flashcard_bp.route('/delete_card/<int:card_id>', methods=['DELETE'])
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

@flashcard_bp.route('/flashcard/<int:card_id>')
def flashcard_view(card_id):
    if 'user_id' in session:
        user = User.query.filter_by(user_id=session['user_id']).first()
        card = Flashcard.query.filter_by(id=card_id, user_id=user.id).first()
        if card:
            return render_template('view_card.html', title=card.title, content=card.content)  # 플래시카드 내용 렌더링
        return "Card not found", 404  # 카드가 없는 경우
    return redirect(url_for('user.login'))  # 로그인되지 않은 경우 로그인 페이지로 리다이렉트

@flashcard_bp.route('/edit_card')
def edit_card():
    if 'user_id' in session:
        return render_template('edit_card.html')  # 카드 수정 페이지 렌더링
    return redirect(url_for('user.login'))  # 로그인되지 않은 경우 로그인 페이지로 리다이렉트

@flashcard_bp.route('/get_cards', methods=['GET'])
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

@flashcard_bp.route('/save_updated_titles', methods=['POST'])
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

@flashcard_bp.route('/delete_cards_by_title', methods=['DELETE'])
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

@flashcard_bp.route('/play_card/<title>', methods=['GET'])
def play_card(title):
    if 'user_id' in session:
        user = User.query.filter_by(user_id=session['user_id']).first()
        card = Flashcard.query.filter_by(title=title, user_id=user.id).first()
        if card:
            return render_template('play_card.html', card=card, title=card.title)
        else:
            return f"제목 '{title}'에 해당하는 카드를 찾을 수 없습니다.", 404
    return redirect(url_for('user.login'))
