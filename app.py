from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate')
def generate():
    return render_template('generate_data.html')

if __name__ == '__main__':
    app.run(debug=True, port=3000)
