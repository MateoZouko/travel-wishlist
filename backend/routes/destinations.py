from flask import Blueprint, jsonify, request
import requests
from database import get_connection

destinations_bp = Blueprint('destinations', __name__)

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
            'created_at': str(row[5])
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
        'created_at': str(row[5])
    })

# Create destination
@destinations_bp.route('/destinations', methods=['POST'])
def create_destination():
    data = request.get_json()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO destinations (name, country, notes, status) VALUES (%s, %s, %s, %s) RETURNING *;",
        (data['name'], data['country'], data.get('notes', ''), data.get('status', 'wishlist'))
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
        'created_at': str(row[5])
    }), 201

# Update destination
@destinations_bp.route('/destinations/<int:id>', methods=['PUT'])
def update_destination(id):
    data = request.get_json()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE destinations SET name=%s, country=%s, notes=%s, status=%s WHERE id=%s RETURNING *;",
        (data['name'], data['country'], data.get('notes', ''), data.get('status', 'wishlist'), id)
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
        'created_at': str(row[5])
    })

# Delete destination
@destinations_bp.route('/destinations/<int:id>', methods=['DELETE'])
def delete_destination(id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM destinations WHERE id=%s RETURNING id;", (id,))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if row is None:
        return jsonify({'error': 'Destination not found'}), 404

    return jsonify({'message': 'Destination deleted'})

# Get ISS location + nearby destinations
@destinations_bp.route('/iss', methods=['GET'])
def get_iss():
    response = requests.get('http://api.open-notify.org/iss-now.json')
    data = response.json()
    return jsonify({
        'latitude': float(data['iss_position']['latitude']),
        'longitude': float(data['iss_position']['longitude']),
        'timestamp': data['timestamp']
    })