CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabelas de sistema que o seu backend exige para não dar Erro 500
CREATE TABLE IF NOT EXISTS "sessions" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES "Users"("Id") ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS "access_logs" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "Users"("Id") ON DELETE CASCADE,
    action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
