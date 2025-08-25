from flask import Flask, send_from_directory, send_file
import os

app = Flask(__name__, static_folder='static')

@app.route('/')
def index():
    return send_file(os.path.join(app.static_folder, 'index.html'))

@app.route('/<path:filename>')
def static_files(filename):
    file_path = os.path.join(app.static_folder, filename)
    if os.path.isfile(file_path):
        return send_file(file_path)
    return 'File not found', 404

if __name__ == '__main__':
    app.run(debug=True)
