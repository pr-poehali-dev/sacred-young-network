import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Music integration with YouTube and Yandex Music (external IDs only)
    Args: event - HTTP event; context - request context
    Returns: User's saved music tracks from external platforms
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Allow-Age': '86400'
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
                user_id = body_data.get('user_id')
                platform = body_data.get('platform', '')
                external_id = body_data.get('external_id', '')
                title = body_data.get('title', '')
                artist = body_data.get('artist', '')
                thumbnail_url = body_data.get('thumbnail_url', '')
                url = body_data.get('url', '')
                
                if not user_id or not platform or not external_id or not title or not url:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'user_id, platform, external_id, title and url are required'})
                    }
                
                if platform not in ['youtube', 'yandex']:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'platform must be youtube or yandex'})
                    }
                
                cur.execute("""
                    INSERT INTO music (user_id, platform, external_id, title, artist, thumbnail_url, url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, user_id, platform, external_id, title, artist, thumbnail_url, url, created_at
                """, (user_id, platform, external_id, title, artist, thumbnail_url, url))
                
                track = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'id': track[0],
                        'user_id': track[1],
                        'platform': track[2],
                        'external_id': track[3],
                        'title': track[4],
                        'artist': track[5],
                        'thumbnail_url': track[6],
                        'url': track[7],
                        'created_at': track[8].isoformat() if track[8] else None
                    })
                }
            
            if method == 'DELETE':
                params = event.get('queryStringParameters', {})
                track_id = params.get('track_id')
                user_id = params.get('user_id')
                
                if not track_id or not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'track_id and user_id are required'})
                    }
                
                cur.execute("DELETE FROM music WHERE id = %s AND user_id = %s", (track_id, user_id))
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
                platform = params.get('platform')
                
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'user_id is required'})
                    }
                
                if platform:
                    cur.execute("""
                        SELECT id, user_id, platform, external_id, title, artist, thumbnail_url, url, created_at
                        FROM music
                        WHERE user_id = %s AND platform = %s
                        ORDER BY created_at DESC
                    """, (user_id, platform))
                else:
                    cur.execute("""
                        SELECT id, user_id, platform, external_id, title, artist, thumbnail_url, url, created_at
                        FROM music
                        WHERE user_id = %s
                        ORDER BY created_at DESC
                    """, (user_id,))
                
                tracks = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps([{
                        'id': t[0],
                        'user_id': t[1],
                        'platform': t[2],
                        'external_id': t[3],
                        'title': t[4],
                        'artist': t[5],
                        'thumbnail_url': t[6],
                        'url': t[7],
                        'created_at': t[8].isoformat() if t[8] else None
                    } for t in tracks])
                }
    finally:
        conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }
