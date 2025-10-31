-- Добавляем таблицу уведомлений
CREATE TABLE t_p65610497_sacred_young_network.notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p65610497_sacred_young_network.users(id),
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    related_user_id INTEGER REFERENCES t_p65610497_sacred_young_network.users(id),
    related_post_id INTEGER REFERENCES t_p65610497_sacred_young_network.posts(id),
    related_community_id INTEGER REFERENCES t_p65610497_sacred_young_network.communities(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого получения уведомлений пользователя
CREATE INDEX idx_notifications_user ON t_p65610497_sacred_young_network.notifications(user_id, is_read, created_at DESC);