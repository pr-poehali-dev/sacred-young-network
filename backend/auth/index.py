import json
import os
import hashlib
import secrets
from typing import Dict, Any
import psycopg2
import psycopg2.extras

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User authentication and registration API
    Args: event with httpMethod, body (username, email, password, action)
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
                    username = body_data.get('username', '')
                    email = body_data.get('email', '')
                    password = body_data.get('password', '')
                    full_name = body_data.get('full_name', '')
                    is_admin = body_data.get('is_admin', False)
                    
                    password_hash = hashlib.sha256(password.encode()).hexdigest()
                    
                    cur.execute(
                        "SELECT id FROM users WHERE username = %s OR email = %s",
                        (username, email)
                    )
                    if cur.fetchone():
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'User already exists'})
                        }
                    
                    cur.execute(
                        """INSERT INTO users (username, email, password_hash, full_name, is_admin) 
                           VALUES (%s, %s, %s, %s, %s) RETURNING id, username, email, full_name, is_admin, created_at""",
                        (username, email, password_hash, full_name, is_admin)
                    )
                    user_row = cur.fetchone()
                    conn.commit()
                    
                    auth_token = secrets.token_urlsafe(32)
                    
                    user_data = {
                        'id': user_row[0],
                        'username': user_row[1],
                        'email': user_row[2],
                        'full_name': user_row[3],
                        'is_admin': user_row[4],
                        'created_at': user_row[5].isoformat(),
                        'auth_token': auth_token
                    }
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps(user_data)
                    }
                
                elif action == 'login':
                    username = body_data.get('username', '')
                    password = body_data.get('password', '')
                    
                    password_hash = hashlib.sha256(password.encode()).hexdigest()
                    
                    cur.execute(
                        """SELECT id, username, email, full_name, is_admin, avatar_url, bio, created_at 
                           FROM users WHERE username = %s AND password_hash = %s""",
                        (username, password_hash)
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
                        'email': user_row[2],
                        'full_name': user_row[3],
                        'is_admin': user_row[4],
                        'avatar_url': user_row[5],
                        'bio': user_row[6],
                        'created_at': user_row[7].isoformat(),
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
                    """SELECT u.id, u.username, u.email, u.full_name, u.is_admin, u.avatar_url, u.bio,
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
                    'email': user_row[2],
                    'full_name': user_row[3],
                    'is_admin': user_row[4],
                    'avatar_url': user_row[5],
                    'bio': user_row[6],
                    'friends_count': user_row[7],
                    'communities_count': user_row[8],
                    'posts_count': user_row[9]
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