-- Create playlists table
CREATE TABLE IF NOT EXISTS t_p65610497_sacred_young_network.playlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_url TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tracks table
CREATE TABLE IF NOT EXISTS t_p65610497_sacred_young_network.tracks (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    duration INTEGER,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    position INTEGER DEFAULT 0
);

-- Create admin requests table for registration approvals
CREATE TABLE IF NOT EXISTS t_p65610497_sacred_young_network.admin_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by INTEGER
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON t_p65610497_sacred_young_network.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_tracks_playlist_id ON t_p65610497_sacred_young_network.tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON t_p65610497_sacred_young_network.admin_requests(status);