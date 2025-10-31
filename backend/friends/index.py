import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manages friend relationships and user search
    Args: event with httpMethod, body, queryStringParameters
          context with request_id
    Returns: HTTP response with friends data or search results
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            action = params.get('action', 'list')
            user_id = params.get('user_id')
            search_query = params.get('q', '').strip()
            
            if action == 'search' and search_query:
                cur.execute("""
                    SELECT id, username, full_name, is_admin
                    FROM t_p65610497_sacred_young_network.users
                    WHERE username ILIKE %s OR full_name ILIKE %s
                    ORDER BY username
                    LIMIT 20
                """, (f'%{search_query}%', f'%{search_query}%'))
                
                users = []
                for row in cur.fetchall():
                    users.append({
                        'id': row[0],
                        'username': row[1],
                        'full_name': row[2],
                        'is_admin': row[3]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'users': users})
                }
            
            if action == 'list' and user_id:
                cur.execute("""
                    SELECT DISTINCT u.id, u.username, u.full_name, u.is_admin
                    FROM t_p65610497_sacred_young_network.users u
                    INNER JOIN t_p65610497_sacred_young_network.friendships f
                    ON (f.user_id = %s AND f.friend_id = u.id)
                    OR (f.friend_id = %s AND f.user_id = u.id)
                    WHERE f.status = 'accepted'
                    ORDER BY u.username
                """, (user_id, user_id))
                
                friends = []
                for row in cur.fetchall():
                    friends.append({
                        'id': row[0],
                        'username': row[1],
                        'full_name': row[2],
                        'is_admin': row[3]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'friends': friends})
                }
            
            if action == 'check' and user_id:
                target_id = params.get('target_id')
                if not target_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'target_id required'})
                    }
                
                cur.execute("""
                    SELECT COUNT(*) FROM t_p65610497_sacred_young_network.friendships
                    WHERE ((user_id = %s AND friend_id = %s)
                    OR (user_id = %s AND friend_id = %s))
                    AND status = 'accepted'
                """, (user_id, target_id, target_id, user_id))
                
                is_friend = cur.fetchone()[0] > 0
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'is_friend': is_friend})
                }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            user_id = body_data.get('user_id')
            target_id = body_data.get('target_id')
            
            if not all([action, user_id, target_id]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Missing required fields'})
                }
            
            if action == 'add':
                cur.execute("""
                    INSERT INTO t_p65610497_sacred_young_network.friendships (user_id, friend_id, status)
                    VALUES (%s, %s, 'accepted')
                    ON CONFLICT DO NOTHING
                    RETURNING id
                """, (user_id, target_id))
                
                result = cur.fetchone()
                
                if result:
                    cur.execute("""
                        INSERT INTO t_p65610497_sacred_young_network.friendships (user_id, friend_id, status)
                        VALUES (%s, %s, 'accepted')
                        ON CONFLICT DO NOTHING
                    """, (target_id, user_id))
                
                conn.commit()
                
                if result:
                    cur.execute("""
                        SELECT username, full_name FROM t_p65610497_sacred_young_network.users WHERE id = %s
                    """, (user_id,))
                    initiator = cur.fetchone()
                    
                    cur.execute("""
                        INSERT INTO t_p65610497_sacred_young_network.notifications
                        (user_id, type, content, related_user_id)
                        VALUES (%s, %s, %s, %s)
                    """, (
                        target_id,
                        'friend_added',
                        f'{initiator[1] or initiator[0]} добавил вас в друзья',
                        user_id
                    ))
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True, 'message': 'Friend added'})
                }
            
            if action == 'remove':
                cur.execute("""
                    DELETE FROM t_p65610497_sacred_young_network.friendships
                    WHERE (user_id = %s AND friend_id = %s)
                    OR (user_id = %s AND friend_id = %s)
                """, (user_id, target_id, target_id, user_id))
                
                conn.commit()
                
                cur.execute("""
                    SELECT username, full_name FROM t_p65610497_sacred_young_network.users WHERE id = %s
                """, (user_id,))
                initiator = cur.fetchone()
                
                cur.execute("""
                    INSERT INTO t_p65610497_sacred_young_network.notifications
                    (user_id, type, content, related_user_id)
                    VALUES (%s, %s, %s, %s)
                """, (
                    target_id,
                    'friend_removed',
                    f'{initiator[1] or initiator[0]} удалил вас из друзей',
                    user_id
                ))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True, 'message': 'Friend removed'})
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
