import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Private messaging system between users
    Args: event - HTTP event; context - request context
    Returns: Messages and conversations
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
                sender_id = body_data.get('sender_id')
                receiver_id = body_data.get('receiver_id')
                content = body_data.get('content', '')
                
                if not sender_id or not receiver_id or not content:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'sender_id, receiver_id and content are required'})
                    }
                
                cur.execute("""
                    INSERT INTO messages (sender_id, receiver_id, content)
                    VALUES (%s, %s, %s)
                    RETURNING id, sender_id, receiver_id, content, is_read, created_at
                """, (sender_id, receiver_id, content))
                
                message = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'id': message[0],
                        'sender_id': message[1],
                        'receiver_id': message[2],
                        'content': message[3],
                        'is_read': message[4],
                        'created_at': message[5].isoformat() if message[5] else None
                    })
                }
            
            if method == 'PUT':
                body_data = json.loads(event.get('body', '{}'))
                user_id = body_data.get('user_id')
                message_id = body_data.get('message_id')
                
                if not user_id or not message_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'user_id and message_id are required'})
                    }
                
                cur.execute("""
                    UPDATE messages
                    SET is_read = true
                    WHERE id = %s AND receiver_id = %s
                """, (message_id, user_id))
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
                with_user_id = params.get('with_user_id')
                
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'user_id is required'})
                    }
                
                if with_user_id:
                    cur.execute("""
                        SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
                               u.username, u.avatar_url
                        FROM messages m
                        JOIN users u ON u.id = CASE WHEN m.sender_id = %s THEN m.receiver_id ELSE m.sender_id END
                        WHERE (m.sender_id = %s AND m.receiver_id = %s) OR (m.sender_id = %s AND m.receiver_id = %s)
                        ORDER BY m.created_at ASC
                    """, (user_id, user_id, with_user_id, with_user_id, user_id))
                    
                    messages = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps([{
                            'id': m[0],
                            'sender_id': m[1],
                            'receiver_id': m[2],
                            'content': m[3],
                            'is_read': m[4],
                            'created_at': m[5].isoformat() if m[5] else None,
                            'username': m[6],
                            'avatar_url': m[7]
                        } for m in messages])
                    }
                
                cur.execute("""
                    SELECT DISTINCT ON (other_user_id)
                           other_user_id,
                           username,
                           avatar_url,
                           last_message,
                           last_message_time,
                           unread_count
                    FROM (
                        SELECT 
                            CASE WHEN m.sender_id = %s THEN m.receiver_id ELSE m.sender_id END as other_user_id,
                            u.username,
                            u.avatar_url,
                            m.content as last_message,
                            m.created_at as last_message_time,
                            (SELECT COUNT(*) FROM messages WHERE sender_id = CASE WHEN m.sender_id = %s THEN m.receiver_id ELSE m.sender_id END 
                             AND receiver_id = %s AND is_read = false) as unread_count,
                            ROW_NUMBER() OVER (PARTITION BY CASE WHEN m.sender_id = %s THEN m.receiver_id ELSE m.sender_id END ORDER BY m.created_at DESC) as rn
                        FROM messages m
                        JOIN users u ON u.id = CASE WHEN m.sender_id = %s THEN m.receiver_id ELSE m.sender_id END
                        WHERE m.sender_id = %s OR m.receiver_id = %s
                    ) sub
                    WHERE rn = 1
                    ORDER BY last_message_time DESC
                """, (user_id, user_id, user_id, user_id, user_id, user_id, user_id))
                
                conversations = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps([{
                        'user_id': c[0],
                        'username': c[1],
                        'avatar_url': c[2],
                        'last_message': c[3],
                        'last_message_time': c[4].isoformat() if c[4] else None,
                        'unread_count': c[5]
                    } for c in conversations])
                }
    finally:
        conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }
