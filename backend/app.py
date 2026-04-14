from flask import Flask
from flask_cors import CORS
from database import init_db
from routes.destinations import destinations_bp
import time
import psycopg2

app = Flask(__name__)
CORS(app)

app.register_blueprint(destinations_bp, url_prefix='/api')

@app.route('/health')
def health():
    return {'status': 'ok'}

def wait_for_db():
    while True:
        try:
            init_db()
            print("Database ready!")
            break
        except psycopg2.OperationalError:
            print("Waiting for database...")
            time.sleep(2)

if __name__ == '__main__':
    wait_for_db()
    app.run(debug=True, host='0.0.0.0', port=5000)