import json
import os
import psycopg2
import bcrypt
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Authentication system with registration validation and age/terms confirmation
    Args: event - HTTP event with method and body; context - request context
    Returns: HTTP response with auth tokens or user data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Database configuration error'})
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action', '')
        
        conn = psycopg2.connect(database_url)
        try:
            with conn.cursor() as cur:
                if action == 'register':
                    email = body_data.get('email', '')
                    username = body_data.get('username', '')
                    password = body_data.get('password', '')
                    full_name = body_data.get('full_name', '')
                    age_confirmed = body_data.get('age_confirmed', False)
                    terms_accepted = body_data.get('terms_accepted', False)
                    
                    if not email or not username or not password:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Email, username and password are required'})
                        }
                    
                    if not age_confirmed or not terms_accepted:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Вы должны подтвердить возраст и принять условия'})
                        }
                    
                    if len(password) < 8:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Пароль должен содержать минимум 8 символов'})
                        }
                    
                    has_upper = any(c.isupper() for c in password)
                    has_lower = any(c.islower() for c in password)
                    has_digit = any(c.isdigit() for c in password)
                    
                    if not (has_upper and has_lower and has_digit):
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Пароль должен содержать заглавные и строчные буквы, а также цифры'})
                        }
                    
                    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    
                    try:
                        cur.execute("""
                            INSERT INTO users (email, username, password_hash, full_name, age_confirmed, terms_accepted)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            RETURNING id, email, username, full_name, created_at
                        """, (email, username, password_hash, full_name, age_confirmed, terms_accepted))
                        
                        user = cur.fetchone()
                        conn.commit()
                        
                        return {
                            'statusCode': 201,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({
                                'id': user[0],
                                'email': user[1],
                                'username': user[2],
                                'full_name': user[3],
                                'created_at': user[4].isoformat() if user[4] else None
                            })
                        }
                    except psycopg2.IntegrityError:
                        conn.rollback()
                        return {
                            'statusCode': 409,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Email или username уже используется'})
                        }
                
                if action == 'login':
                    email = body_data.get('email', '')
                    password = body_data.get('password', '')
                    
                    if not email or not password:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Email and password are required'})
                        }
                    
                    cur.execute("SELECT id, email, username, password_hash, full_name, avatar_url, bio FROM users WHERE email = %s", (email,))
                    user = cur.fetchone()
                    
                    if not user:
                        return {
                            'statusCode': 401,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Неверный email или пароль'})
                        }
                    
                    if not bcrypt.checkpw(password.encode('utf-8'), user[3].encode('utf-8')):
                        return {
                            'statusCode': 401,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Неверный email или пароль'})
                        }
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'id': user[0],
                            'email': user[1],
                            'username': user[2],
                            'full_name': user[4],
                            'avatar_url': user[5],
                            'bio': user[6]
                        })
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
                'body': json.dumps({'error': 'user_id is required'})
            }
        
        conn = psycopg2.connect(database_url)
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id, email, username, full_name, avatar_url, bio, created_at FROM users WHERE id = %s", (user_id,))
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'User not found'})
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'id': user[0],
                        'email': user[1],
                        'username': user[2],
                        'full_name': user[3],
                        'avatar_url': user[4],
                        'bio': user[5],
                        'created_at': user[6].isoformat() if user[6] else None
                    })
                }
        finally:
            conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }
