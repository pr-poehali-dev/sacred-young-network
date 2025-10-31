import json
import os
from typing import Dict, Any
import psycopg2
import psycopg2.extras

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Posts management API - create, read, like, comment
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with posts data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        limit = int(params.get('limit', 20))
        offset = int(params.get('offset', 0))
        user_id = params.get('user_id')
        
        conn = psycopg2.connect(database_url)
        try:
            with conn.cursor() as cur:
                if user_id:
                    cur.execute(
                        """SELECT p.id, p.content, p.image_url, p.likes_count, p.comments_count, p.created_at,
                                  u.id, u.username, u.full_name, u.avatar_url
                           FROM posts p
                           JOIN users u ON p.user_id = u.id
                           WHERE p.user_id = %s
                           ORDER BY p.created_at DESC
                           LIMIT %s OFFSET %s""",
                        (user_id, limit, offset)
                    )
                else:
                    cur.execute(
                        """SELECT p.id, p.content, p.image_url, p.likes_count, p.comments_count, p.created_at,
                                  u.id, u.username, u.full_name, u.avatar_url
                           FROM posts p
                           JOIN users u ON p.user_id = u.id
                           ORDER BY p.created_at DESC
                           LIMIT %s OFFSET %s""",
                        (limit, offset)
                    )
                
                posts = []
                for row in cur.fetchall():
                    posts.append({
                        'id': row[0],
                        'content': row[1],
                        'image_url': row[2],
                        'likes_count': row[3],
                        'comments_count': row[4],
                        'created_at': row[5].isoformat(),
                        'author': {
                            'id': row[6],
                            'username': row[7],
                            'full_name': row[8],
                            'avatar_url': row[9]
                        }
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'posts': posts})
                }
        finally:
            conn.close()
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action', 'create')
        
        conn = psycopg2.connect(database_url)
        try:
            with conn.cursor() as cur:
                if action == 'create':
                    user_id = body_data.get('user_id')
                    content = body_data.get('content', '')
                    image_url = body_data.get('image_url')
                    
                    cur.execute(
                        """INSERT INTO posts (user_id, content, image_url)
                           VALUES (%s, %s, %s)
                           RETURNING id, content, image_url, likes_count, comments_count, created_at""",
                        (user_id, content, image_url)
                    )
                    post_row = cur.fetchone()
                    conn.commit()
                    
                    post_data = {
                        'id': post_row[0],
                        'content': post_row[1],
                        'image_url': post_row[2],
                        'likes_count': post_row[3],
                        'comments_count': post_row[4],
                        'created_at': post_row[5].isoformat()
                    }
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps(post_data)
                    }
                
                elif action == 'like':
                    post_id = body_data.get('post_id')
                    user_id = body_data.get('user_id')
                    
                    cur.execute(
                        "SELECT id FROM post_likes WHERE post_id = %s AND user_id = %s",
                        (post_id, user_id)
                    )
                    
                    if cur.fetchone():
                        cur.execute(
                            "DELETE FROM post_likes WHERE post_id = %s AND user_id = %s",
                            (post_id, user_id)
                        )
                        cur.execute(
                            "UPDATE posts SET likes_count = likes_count - 1 WHERE id = %s RETURNING likes_count",
                            (post_id,)
                        )
                        liked = False
                    else:
                        cur.execute(
                            "INSERT INTO post_likes (post_id, user_id) VALUES (%s, %s)",
                            (post_id, user_id)
                        )
                        cur.execute(
                            "UPDATE posts SET likes_count = likes_count + 1 WHERE id = %s RETURNING likes_count",
                            (post_id,)
                        )
                        liked = True
                    
                    likes_count = cur.fetchone()[0]
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'liked': liked, 'likes_count': likes_count})
                    }
                
                elif action == 'comment':
                    post_id = body_data.get('post_id')
                    user_id = body_data.get('user_id')
                    content = body_data.get('content', '')
                    
                    cur.execute(
                        "INSERT INTO comments (post_id, user_id, content) VALUES (%s, %s, %s) RETURNING id, created_at",
                        (post_id, user_id, content)
                    )
                    comment_row = cur.fetchone()
                    
                    cur.execute(
                        "UPDATE posts SET comments_count = comments_count + 1 WHERE id = %s RETURNING comments_count",
                        (post_id,)
                    )
                    comments_count = cur.fetchone()[0]
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'comment_id': comment_row[0],
                            'created_at': comment_row[1].isoformat(),
                            'comments_count': comments_count
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