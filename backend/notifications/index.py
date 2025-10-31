import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manages user notifications
    Args: event with httpMethod, queryStringParameters, body
          context with request_id
    Returns: HTTP response with notifications data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
            user_id = params.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'user_id required'})
                }
            
            cur.execute("""
                SELECT 
                    n.id, 
                    n.type, 
                    n.content, 
                    n.is_read, 
                    n.created_at,
                    n.related_user_id,
                    u.username as related_username,
                    u.full_name as related_user_fullname
                FROM t_p65610497_sacred_young_network.notifications n
                LEFT JOIN t_p65610497_sacred_young_network.users u 
                ON n.related_user_id = u.id
                WHERE n.user_id = %s
                ORDER BY n.created_at DESC
                LIMIT 50
            """, (user_id,))
            
            notifications = []
            unread_count = 0
            
            for row in cur.fetchall():
                notif = {
                    'id': row[0],
                    'type': row[1],
                    'content': row[2],
                    'is_read': row[3],
                    'created_at': row[4].isoformat() if row[4] else None,
                    'related_user': {
                        'id': row[5],
                        'username': row[6],
                        'full_name': row[7]
                    } if row[5] else None
                }
                notifications.append(notif)
                if not row[3]:
                    unread_count += 1
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({
                    'notifications': notifications,
                    'unread_count': unread_count
                })
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'mark_read':
                notification_id = body_data.get('notification_id')
                user_id = body_data.get('user_id')
                
                if notification_id:
                    cur.execute("""
                        UPDATE t_p65610497_sacred_young_network.notifications
                        SET is_read = TRUE
                        WHERE id = %s
                    """, (notification_id,))
                elif user_id:
                    cur.execute("""
                        UPDATE t_p65610497_sacred_young_network.notifications
                        SET is_read = TRUE
                        WHERE user_id = %s AND is_read = FALSE
                    """, (user_id,))
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'notification_id or user_id required'})
                    }
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            if action == 'create':
                user_id = body_data.get('user_id')
                notif_type = body_data.get('type')
                content = body_data.get('content')
                related_user_id = body_data.get('related_user_id')
                
                if not all([user_id, notif_type, content]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Missing required fields'})
                    }
                
                cur.execute("""
                    INSERT INTO t_p65610497_sacred_young_network.notifications
                    (user_id, type, content, related_user_id)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                """, (user_id, notif_type, content, related_user_id))
                
                notif_id = cur.fetchone()[0]
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True, 'notification_id': notif_id})
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
