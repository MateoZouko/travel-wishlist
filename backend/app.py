from flask import Flask
from flask_cors import CORS
from database import init_db
from routes.destinations import destinations_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(destinations_bp, url_prefix='/api')

@app.route('/health')
def health():
    return {'status': 'ok'}

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
    