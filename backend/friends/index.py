import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Friends system with requests and status management
    Args: event - HTTP event; context - request context
    Returns: Friends list and requests
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
    
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            if method == 'POST':
                body_data = json.loads(event.get('body', '{}'))
                action = body_data.get('action', '')
                user_id = body_data.get('user_id')
                friend_id = body_data.get('friend_id')
                
                if not user_id or not friend_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'user_id and friend_id are required'})
                    }
                
                if action == 'send_request':
                    try:
                        cur.execute("""
                            INSERT INTO friends (user_id, friend_id, status)
                            VALUES (%s, %s, 'pending')
                            RETURNING id
                        """, (user_id, friend_id))
                        conn.commit()
                        
                        return {
                            'statusCode': 201,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'success': True})
                        }
                    except psycopg2.IntegrityError:
                        conn.rollback()
                        return {
                            'statusCode': 409,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Request already exists'})
                        }
                
                if action == 'accept':
                    cur.execute("""
                        UPDATE friends 
                        SET status = 'accepted'
                        WHERE friend_id = %s AND user_id = %s AND status = 'pending'
                    """, (user_id, friend_id))
                    
                    cur.execute("""
                        INSERT INTO friends (user_id, friend_id, status)
                        VALUES (%s, %s, 'accepted')
                        ON CONFLICT (user_id, friend_id) DO NOTHING
                    """, (user_id, friend_id))
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'success': True})
                    }
                
                if action == 'reject':
                    cur.execute("""
                        DELETE FROM friends
                        WHERE friend_id = %s AND user_id = %s AND status = 'pending'
                    """, (user_id, friend_id))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'success': True})
                    }
                
                if action == 'remove':
                    cur.execute("""
                        DELETE FROM friends
                        WHERE (user_id = %s AND friend_id = %s) OR (user_id = %s AND friend_id = %s)
                    """, (user_id, friend_id, friend_id, user_id))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'success': True})
                    }
            
            if method == 'GET':
                params = event.get('queryStringParameters', {})
                user_id = params.get('user_id')
                request_type = params.get('type', 'friends')
                
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'user_id is required'})
                    }
                
                if request_type == 'pending':
                    cur.execute("""
                        SELECT f.id, f.user_id, u.username, u.full_name, u.avatar_url, f.created_at
                        FROM friends f
                        JOIN users u ON f.user_id = u.id
                        WHERE f.friend_id = %s AND f.status = 'pending'
                        ORDER BY f.created_at DESC
                    """, (user_id,))
                    
                    requests = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps([{
                            'id': r[0],
                            'user_id': r[1],
                            'username': r[2],
                            'full_name': r[3],
                            'avatar_url': r[4],
                            'created_at': r[5].isoformat() if r[5] else None
                        } for r in requests])
                    }
                
                cur.execute("""
                    SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio
                    FROM friends f
                    JOIN users u ON (f.friend_id = u.id AND f.user_id = %s) OR (f.user_id = u.id AND f.friend_id = %s)
                    WHERE f.status = 'accepted' AND u.id != %s
                    ORDER BY u.username
                """, (user_id, user_id, user_id))
                
                friends = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps([{
                        'id': f[0],
                        'username': f[1],
                        'full_name': f[2],
                        'avatar_url': f[3],
                        'bio': f[4]
                    } for f in friends])
                }
    finally:
        conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }
