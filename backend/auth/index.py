import json
import os
import hashlib
import secrets
from typing import Dict, Any
import psycopg2
import psycopg2.extras

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User authentication and registration API with phone-based auth
    Args: event with httpMethod, body (phone, password, full_name, birth_date, city, email)
    Returns: HTTP response with user data or auth token
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action', 'login')
        
        conn = psycopg2.connect(database_url)
        try:
            with conn.cursor() as cur:
                if action == 'register':
                    phone = body_data.get('phone', '')
                    password = body_data.get('password', '')
                    full_name = body_data.get('full_name', '')
                    birth_date = body_data.get('birth_date', '')
                    city = body_data.get('city', '')
                    email = body_data.get('email', '')
                    is_admin = body_data.get('is_admin', False)
                    
                    if not phone or not password or not full_name or not birth_date:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Phone, password, full_name and birth_date are required'})
                        }
                    
                    password_hash = hashlib.sha256(password.encode()).hexdigest()
                    
                    cur.execute(
                        "SELECT id FROM users WHERE phone = %s",
                        (phone,)
                    )
                    if cur.fetchone():
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Phone number already registered'})
                        }
                    
                    username = f"user_{phone.replace('+', '').replace('-', '')}"
                    
                    cur.execute(
                        """INSERT INTO users (username, phone, email, password_hash, full_name, birth_date, city, is_admin) 
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s) 
                           RETURNING id, username, phone, email, full_name, birth_date, city, is_admin, created_at""",
                        (username, phone, email, password_hash, full_name, birth_date, city, is_admin)
                    )
                    user_row = cur.fetchone()
                    conn.commit()
                    
                    auth_token = secrets.token_urlsafe(32)
                    
                    user_data = {
                        'id': user_row[0],
                        'username': user_row[1],
                        'phone': user_row[2],
                        'email': user_row[3],
                        'full_name': user_row[4],
                        'birth_date': user_row[5].isoformat() if user_row[5] else None,
                        'city': user_row[6],
                        'is_admin': user_row[7],
                        'created_at': user_row[8].isoformat(),
                        'auth_token': auth_token
                    }
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps(user_data)
                    }
                
                elif action == 'login':
                    phone = body_data.get('phone', '')
                    password = body_data.get('password', '')
                    
                    password_hash = hashlib.sha256(password.encode()).hexdigest()
                    
                    cur.execute(
                        """SELECT id, username, phone, email, full_name, birth_date, city, is_admin, avatar_url, bio, email_visible, created_at 
                           FROM users WHERE phone = %s AND password_hash = %s""",
                        (phone, password_hash)
                    )
                    user_row = cur.fetchone()
                    
                    if not user_row:
                        return {
                            'statusCode': 401,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Invalid credentials'})
                        }
                    
                    auth_token = secrets.token_urlsafe(32)
                    
                    user_data = {
                        'id': user_row[0],
                        'username': user_row[1],
                        'phone': user_row[2],
                        'email': user_row[3],
                        'full_name': user_row[4],
                        'birth_date': user_row[5].isoformat() if user_row[5] else None,
                        'city': user_row[6],
                        'is_admin': user_row[7],
                        'avatar_url': user_row[8],
                        'bio': user_row[9],
                        'email_visible': user_row[10],
                        'created_at': user_row[11].isoformat(),
                        'auth_token': auth_token
                    }
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps(user_data)
                    }
        finally:
            conn.close()
    
    if method == 'GET':
        user_id = event.get('queryStringParameters', {}).get('user_id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'user_id required'})
            }
        
        conn = psycopg2.connect(database_url)
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT u.id, u.username, u.phone, u.email, u.full_name, u.birth_date, u.city, u.is_admin, u.avatar_url, u.bio, u.email_visible,
                              (SELECT COUNT(*) FROM friendships WHERE user_id = u.id AND status = 'accepted') as friends_count,
                              (SELECT COUNT(*) FROM community_members WHERE user_id = u.id) as communities_count,
                              (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count
                       FROM users u WHERE u.id = %s""",
                    (user_id,)
                )
                user_row = cur.fetchone()
                
                if not user_row:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'User not found'})
                    }
                
                user_data = {
                    'id': user_row[0],
                    'username': user_row[1],
                    'phone': user_row[2],
                    'email': user_row[3] if user_row[10] else None,
                    'full_name': user_row[4],
                    'birth_date': user_row[5].isoformat() if user_row[5] else None,
                    'city': user_row[6],
                    'is_admin': user_row[7],
                    'avatar_url': user_row[8],
                    'bio': user_row[9],
                    'email_visible': user_row[10],
                    'friends_count': user_row[11],
                    'communities_count': user_row[12],
                    'posts_count': user_row[13]
                }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps(user_data)
                }
        finally:
            conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }