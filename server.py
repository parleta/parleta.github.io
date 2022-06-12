from flask import Flask, render_template

app = Flask(__name__, template_folder='')

@app.route('/')
@app.route('/index.html')
def index():
    return render_template('index.html')

@app.route('/home.html')
def home():
    return render_template('home.html')

@app.route('/teacher_class.html')
def teacherClass():
    return render_template('/teacher_class.html')

@app.route('/student_class.html')
def studentClass():
    return render_template('/student_class.html')

app.run(host='0.0.0.0')