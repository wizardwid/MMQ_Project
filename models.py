from flask_sqlalchemy import SQLAlchemy

# 데이터베이스 초기화
db = SQLAlchemy()

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

class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.String, nullable=False)
    choice_1 = db.Column(db.String, nullable=False)
    choice_2 = db.Column(db.String, nullable=False)
    choice_3 = db.Column(db.String, nullable=False)
    choice_4 = db.Column(db.String, nullable=False)
    correct_answer = db.Column(db.String, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'question_text': self.question_text,
            'choices': [self.choice_1, self.choice_2, self.choice_3, self.choice_4],
            'correct_answer': self.correct_answer
        }