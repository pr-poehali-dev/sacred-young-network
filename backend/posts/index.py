import json
import os
from typing import Dict, Any
import psycopg2
import psycopg2.extras

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Posts and music playlists management API
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with posts/playlists data
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
        playlist_id = params.get('playlist_id')
        resource_type = params.get('type', 'posts')
        
        conn = psycopg2.connect(database_url)
        try:
            with conn.cursor() as cur:
                if resource_type == 'playlists':
                    if playlist_id:
                        cur.execute("""
                            SELECT id, title, artist, url, duration, position
                            FROM t_p65610497_sacred_young_network.tracks
                            WHERE playlist_id = %s
                            ORDER BY position ASC, added_at ASC
                        """, (playlist_id,))
                        
                        tracks = []
                        for row in cur.fetchall():
                            tracks.append({
                                'id': row[0],
                                'title': row[1],
                                'artist': row[2],
                                'url': row[3],
                                'duration': row[4],
                                'position': row[5]
                            })
                        
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'tracks': tracks})
                        }
                    
                    if user_id:
                        cur.execute("""
                            SELECT p.id, p.name, p.description, p.cover_url, p.is_public, p.created_at,
                                   COUNT(t.id) as track_count
                            FROM t_p65610497_sacred_young_network.playlists p
                            LEFT JOIN t_p65610497_sacred_young_network.tracks t ON p.id = t.playlist_id
                            WHERE p.user_id = %s
                            GROUP BY p.id
                            ORDER BY p.created_at DESC
                        """, (user_id,))
                        
                        playlists = []
                        for row in cur.fetchall():
                            playlists.append({
                                'id': row[0],
                                'name': row[1],
                                'description': row[2],
                                'cover_url': row[3],
                                'is_public': row[4],
                                'created_at': row[5].isoformat() if row[5] else None,
                                'track_count': row[6]
                            })
                        
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'playlists': playlists})
                        }
                
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
                
                elif action == 'create_playlist':
                    user_id = body_data.get('user_id')
                    name = body_data.get('name')
                    description = body_data.get('description', '')
                    is_public = body_data.get('is_public', True)
                    
                    if not user_id or not name:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'user_id and name required'})
                        }
                    
                    cur.execute("""
                        INSERT INTO t_p65610497_sacred_young_network.playlists
                        (user_id, name, description, is_public)
                        VALUES (%s, %s, %s, %s)
                        RETURNING id
                    """, (user_id, name, description, is_public))
                    
                    playlist_id = cur.fetchone()[0]
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'success': True, 'playlist_id': playlist_id})
                    }
                
                elif action == 'add_track':
                    playlist_id = body_data.get('playlist_id')
                    title = body_data.get('title')
                    artist = body_data.get('artist')
                    url = body_data.get('url')
                    duration = body_data.get('duration', 0)
                    
                    if not all([playlist_id, title, artist, url]):
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Missing required fields'})
                        }
                    
                    cur.execute("""
                        SELECT COALESCE(MAX(position), -1) + 1
                        FROM t_p65610497_sacred_young_network.tracks
                        WHERE playlist_id = %s
                    """, (playlist_id,))
                    
                    position = cur.fetchone()[0]
                    
                    cur.execute("""
                        INSERT INTO t_p65610497_sacred_young_network.tracks
                        (playlist_id, title, artist, url, duration, position)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (playlist_id, title, artist, url, duration, position))
                    
                    track_id = cur.fetchone()[0]
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'success': True, 'track_id': track_id})
                    }
        finally:
            conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }