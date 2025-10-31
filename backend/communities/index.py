import json
import os
from typing import Dict, Any
import psycopg2
import psycopg2.extras

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Communities management API - list, join, leave communities
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with communities data
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
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        user_id = params.get('user_id')
        
        conn = psycopg2.connect(database_url)
        try:
            with conn.cursor() as cur:
                if user_id:
                    cur.execute(
                        """SELECT c.id, c.name, c.description, c.avatar_url, c.color, c.members_count,
                                  EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = %s) as is_member
                           FROM communities c
                           ORDER BY c.members_count DESC""",
                        (user_id,)
                    )
                else:
                    cur.execute(
                        """SELECT c.id, c.name, c.description, c.avatar_url, c.color, c.members_count, false as is_member
                           FROM communities c
                           ORDER BY c.members_count DESC"""
                    )
                
                communities = []
                for row in cur.fetchall():
                    communities.append({
                        'id': row[0],
                        'name': row[1],
                        'description': row[2],
                        'avatar_url': row[3],
                        'color': row[4],
                        'members_count': row[5],
                        'is_member': row[6]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'communities': communities})
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
                    name = body_data.get('name', '')
                    description = body_data.get('description', '')
                    created_by = body_data.get('created_by')
                    color = body_data.get('color', 'bg-yellow-500')
                    
                    cur.execute(
                        """INSERT INTO communities (name, description, created_by, color, members_count)
                           VALUES (%s, %s, %s, %s, 1)
                           RETURNING id, name, description, color, members_count""",
                        (name, description, created_by, color)
                    )
                    community_row = cur.fetchone()
                    
                    cur.execute(
                        "INSERT INTO community_members (community_id, user_id) VALUES (%s, %s)",
                        (community_row[0], created_by)
                    )
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'id': community_row[0],
                            'name': community_row[1],
                            'description': community_row[2],
                            'color': community_row[3],
                            'members_count': community_row[4]
                        })
                    }
                
                elif action == 'join':
                    community_id = body_data.get('community_id')
                    user_id = body_data.get('user_id')
                    
                    cur.execute(
                        "SELECT id FROM community_members WHERE community_id = %s AND user_id = %s",
                        (community_id, user_id)
                    )
                    
                    if cur.fetchone():
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Already a member'})
                        }
                    
                    cur.execute(
                        "INSERT INTO community_members (community_id, user_id) VALUES (%s, %s)",
                        (community_id, user_id)
                    )
                    cur.execute(
                        "UPDATE communities SET members_count = members_count + 1 WHERE id = %s RETURNING members_count",
                        (community_id,)
                    )
                    members_count = cur.fetchone()[0]
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'members_count': members_count, 'is_member': True})
                    }
                
                elif action == 'leave':
                    community_id = body_data.get('community_id')
                    user_id = body_data.get('user_id')
                    
                    cur.execute(
                        "DELETE FROM community_members WHERE community_id = %s AND user_id = %s",
                        (community_id, user_id)
                    )
                    cur.execute(
                        "UPDATE communities SET members_count = members_count - 1 WHERE id = %s RETURNING members_count",
                        (community_id,)
                    )
                    members_count = cur.fetchone()[0]
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'members_count': members_count, 'is_member': False})
                    }
        finally:
            conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }