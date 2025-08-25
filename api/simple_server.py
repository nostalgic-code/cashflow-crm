from flask import Flask, send_file
import os

app = Flask(__name__)

@app.route('/')
def index():
    return send_file(os.path.join(os.path.dirname(__file__), 'index.html'))

@app.route('/<path:filename>')
def static_files(filename):
    # Serve any file in the same directory (html, css, js, images, etc.)
    file_path = os.path.join(os.path.dirname(__file__), filename)
    if os.path.isfile(file_path):
        return send_file(file_path)
    return 'File not found', 404

if __name__ == '__main__':
    app.run(debug=True)
