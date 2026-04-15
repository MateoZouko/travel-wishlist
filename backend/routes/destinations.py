from flask import Blueprint, jsonify, request
import requests
from database import get_connection

destinations_bp = Blueprint('destinations', __name__)

def enrich_with_country_data(country_name: str):
    try:
        res = requests.get(f'https://restcountries.com/v3.1/name/{country_name}', timeout=5)
        if res.status_code == 200:
            data = res.json()[0]
            capital = data.get('capital', ['N/A'])[0]
            currencies = data.get('currencies', {})
            currency = list(currencies.keys())[0] if currencies else 'N/A'
            flag_url = data.get('flags', {}).get('png', '')
            return capital, currency, flag_url
    except Exception:
        pass
    return 'N/A', 'N/A', ''

# Get all destinations
@destinations_bp.route('/destinations', methods=['GET'])
def get_destinations():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM destinations ORDER BY created_at DESC;")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    destinations = []
    for row in rows:
        destinations.append({
            'id': row[0],
            'name': row[1],
            'country': row[2],
            'notes': row[3],
            'status': row[4],
            'created_at': str(row[5]),
            'capital': row[6],
            'currency': row[7],
            'flag_url': row[8]
        })
    return jsonify(destinations)

# Get single destination
@destinations_bp.route('/destinations/<int:id>', methods=['GET'])
def get_destination(id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM destinations WHERE id = %s;", (id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if row is None:
        return jsonify({'error': 'Destination not found'}), 404

    return jsonify({
        'id': row[0],
        'name': row[1],
        'country': row[2],
        'notes': row[3],
        'status': row[4],
        'created_at': str(row[5]),
        'capital': row[6],
        'currency': row[7],
        'flag_url': row[8]
    })

# Create destination usando stored procedure + RestCountries
@destinations_bp.route('/destinations', methods=['POST'])
def create_destination():
    data = request.get_json()
    capital, currency, flag_url = enrich_with_country_data(data['country'])
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO destinations (name, country, notes, status, capital, currency, flag_url)
           VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *;""",
        (data['name'], data['country'], data.get('notes', ''), data.get('status', 'wishlist'), capital, currency, flag_url)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        'id': row[0],
        'name': row[1],
        'country': row[2],
        'notes': row[3],
        'status': row[4],
        'created_at': str(row[5]),
        'capital': row[6],
        'currency': row[7],
        'flag_url': row[8]
    }), 201

# Update destination
@destinations_bp.route('/destinations/<int:id>', methods=['PUT'])
def update_destination(id):
    data = request.get_json()
    capital, currency, flag_url = enrich_with_country_data(data['country'])
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """UPDATE destinations 
           SET name=%s, country=%s, notes=%s, status=%s, capital=%s, currency=%s, flag_url=%s 
           WHERE id=%s RETURNING *;""",
        (data['name'], data['country'], data.get('notes', ''), data.get('status', 'wishlist'), capital, currency, flag_url, id)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if row is None:
        return jsonify({'error': 'Destination not found'}), 404

    return jsonify({
        'id': row[0],
        'name': row[1],
        'country': row[2],
        'notes': row[3],
        'status': row[4],
        'created_at': str(row[5]),
        'capital': row[6],
        'currency': row[7],
        'flag_url': row[8]
    })

# Delete destination
@destinations_bp.route('/destinations/<int:id>', methods=['DELETE'])
def delete_destination(id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT delete_destination(%s);", (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Destination deleted'})
