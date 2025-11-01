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
            
            if action == 'get_admin_requests':
                admin_phone = body_data.get('admin_phone')
                
                if admin_phone != '+79270011297':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Access denied'})
                    }
                
                cur.execute("""
                    SELECT 
                        ar.id, 
                        ar.requester_id, 
                        ar.status, 
                        ar.created_at,
                        u.username,
                        u.full_name,
                        u.phone
                    FROM t_p65610497_sacred_young_network.admin_requests ar
                    JOIN t_p65610497_sacred_young_network.users u ON ar.requester_id = u.id
                    WHERE ar.status = 'pending'
                    ORDER BY ar.created_at DESC
                """)
                
                requests = []
                for row in cur.fetchall():
                    requests.append({
                        'id': row[0],
                        'requester_id': row[1],
                        'status': row[2],
                        'created_at': row[3].isoformat() if row[3] else None,
                        'username': row[4],
                        'full_name': row[5],
                        'phone': row[6]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'requests': requests})
                }
            
            if action == 'resolve_admin_request':
                admin_phone = body_data.get('admin_phone')
                request_id = body_data.get('request_id')
                decision = body_data.get('decision')
                
                if admin_phone != '+79270011297':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Access denied'})
                    }
                
                if decision == 'approve':
                    cur.execute("""
                        SELECT requester_id FROM t_p65610497_sacred_young_network.admin_requests
                        WHERE id = %s
                    """, (request_id,))
                    
                    result = cur.fetchone()
                    if result:
                        requester_id = result[0]
                        
                        cur.execute("""
                            UPDATE t_p65610497_sacred_young_network.users
                            SET is_admin = TRUE
                            WHERE id = %s
                        """, (requester_id,))
                        
                        cur.execute("""
                            UPDATE t_p65610497_sacred_young_network.admin_requests
                            SET status = 'approved', resolved_at = CURRENT_TIMESTAMP
                            WHERE id = %s
                        """, (request_id,))
                        
                        conn.commit()
                        
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'success': True, 'message': 'User promoted to admin'})
                        }
                elif decision == 'reject':
                    cur.execute("""
                        UPDATE t_p65610497_sacred_young_network.admin_requests
                        SET status = 'rejected', resolved_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (request_id,))
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'success': True, 'message': 'Request rejected'})
                    }
                
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Invalid decision'})
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