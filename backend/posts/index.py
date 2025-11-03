import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Posts management with likes and comments
    Args: event - HTTP event; context - request context
    Returns: Posts data with engagement stats
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
                action = body_data.get('action', 'create_post')
                
                if action == 'create_post':
                    user_id = body_data.get('user_id')
                    content = body_data.get('content', '')
                    media_url = body_data.get('media_url', '')
                    media_type = body_data.get('media_type', '')
                    
                    if not user_id or not content:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'user_id and content are required'})
                        }
                    
                    cur.execute("""
                        INSERT INTO posts (user_id, content, media_url, media_type)
                        VALUES (%s, %s, %s, %s)
                        RETURNING id, user_id, content, media_url, media_type, created_at
                    """, (user_id, content, media_url, media_type))
                    
                    post = cur.fetchone()
                    conn.commit()
                    
                    return {
                        'statusCode': 201,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'id': post[0],
                            'user_id': post[1],
                            'content': post[2],
                            'media_url': post[3],
                            'media_type': post[4],
                            'created_at': post[5].isoformat() if post[5] else None,
                            'likes_count': 0,
                            'comments_count': 0
                        })
                    }
                
                if action == 'like':
                    user_id = body_data.get('user_id')
                    post_id = body_data.get('post_id')
                    
                    if not user_id or not post_id:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'user_id and post_id are required'})
                        }
                    
                    try:
                        cur.execute("INSERT INTO likes (user_id, post_id) VALUES (%s, %s)", (user_id, post_id))
                        conn.commit()
                        return {
                            'statusCode': 200,
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
                            'body': json.dumps({'error': 'Already liked'})
                        }
                
                if action == 'unlike':
                    user_id = body_data.get('user_id')
                    post_id = body_data.get('post_id')
                    
                    if not user_id or not post_id:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'user_id and post_id are required'})
                        }
                    
                    cur.execute("DELETE FROM likes WHERE user_id = %s AND post_id = %s", (user_id, post_id))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'success': True})
                    }
                
                if action == 'comment':
                    user_id = body_data.get('user_id')
                    post_id = body_data.get('post_id')
                    content = body_data.get('content', '')
                    
                    if not user_id or not post_id or not content:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'user_id, post_id and content are required'})
                        }
                    
                    cur.execute("""
                        INSERT INTO comments (user_id, post_id, content)
                        VALUES (%s, %s, %s)
                        RETURNING id, user_id, post_id, content, created_at
                    """, (user_id, post_id, content))
                    
                    comment = cur.fetchone()
                    conn.commit()
                    
                    return {
                        'statusCode': 201,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'id': comment[0],
                            'user_id': comment[1],
                            'post_id': comment[2],
                            'content': comment[3],
                            'created_at': comment[4].isoformat() if comment[4] else None
                        })
                    }
            
            if method == 'GET':
                params = event.get('queryStringParameters', {})
                user_id = params.get('user_id')
                post_id = params.get('post_id')
                
                if post_id:
                    cur.execute("""
                        SELECT p.id, p.user_id, p.content, p.media_url, p.media_type, p.created_at,
                               u.username, u.full_name, u.avatar_url,
                               COUNT(DISTINCT l.id) as likes_count,
                               COUNT(DISTINCT c.id) as comments_count
                        FROM posts p
                        JOIN users u ON p.user_id = u.id
                        LEFT JOIN likes l ON p.id = l.post_id
                        LEFT JOIN comments c ON p.id = c.post_id
                        WHERE p.id = %s
                        GROUP BY p.id, u.id
                    """, (post_id,))
                    
                    post = cur.fetchone()
                    if not post:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Post not found'})
                        }
                    
                    cur.execute("""
                        SELECT c.id, c.content, c.created_at, u.username, u.avatar_url
                        FROM comments c
                        JOIN users u ON c.user_id = u.id
                        WHERE c.post_id = %s
                        ORDER BY c.created_at DESC
                    """, (post_id,))
                    
                    comments = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'id': post[0],
                            'user_id': post[1],
                            'content': post[2],
                            'media_url': post[3],
                            'media_type': post[4],
                            'created_at': post[5].isoformat() if post[5] else None,
                            'username': post[6],
                            'full_name': post[7],
                            'avatar_url': post[8],
                            'likes_count': post[9],
                            'comments_count': post[10],
                            'comments': [{
                                'id': c[0],
                                'content': c[1],
                                'created_at': c[2].isoformat() if c[2] else None,
                                'username': c[3],
                                'avatar_url': c[4]
                            } for c in comments]
                        })
                    }
                
                cur.execute("""
                    SELECT p.id, p.user_id, p.content, p.media_url, p.media_type, p.created_at,
                           u.username, u.full_name, u.avatar_url,
                           COUNT(DISTINCT l.id) as likes_count,
                           COUNT(DISTINCT c.id) as comments_count
                    FROM posts p
                    JOIN users u ON p.user_id = u.id
                    LEFT JOIN likes l ON p.id = l.post_id
                    LEFT JOIN comments c ON p.id = c.post_id
                    {} 
                    GROUP BY p.id, u.id
                    ORDER BY p.created_at DESC
                    LIMIT 50
                """.format("WHERE p.user_id = %s" if user_id else ""), (user_id,) if user_id else ())
                
                posts = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps([{
                        'id': p[0],
                        'user_id': p[1],
                        'content': p[2],
                        'media_url': p[3],
                        'media_type': p[4],
                        'created_at': p[5].isoformat() if p[5] else None,
                        'username': p[6],
                        'full_name': p[7],
                        'avatar_url': p[8],
                        'likes_count': p[9],
                        'comments_count': p[10]
                    } for p in posts])
                }
    finally:
        conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }
