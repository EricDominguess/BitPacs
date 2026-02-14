-- BitPacs Database Initialization Script
-- PostgreSQL 16

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- Tabela de Usuários
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'radiologist', 'technician', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- ==========================================
-- Tabela de Sessões
-- ==========================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    refresh_token VARCHAR(500),
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- ==========================================
-- Tabela de Logs de Acesso
-- ==========================================
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255),
    method VARCHAR(10),
    status_code INTEGER,
    ip_address INET,
    user_agent TEXT,
    request_payload JSONB,
    response_payload JSONB,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- Tabela de Servidores Orthanc
-- ==========================================
CREATE TABLE IF NOT EXISTS orthanc_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    password_encrypted VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    location VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_health_check TIMESTAMP WITH TIME ZONE,
    health_status VARCHAR(20) DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'unhealthy', 'unknown'))
);

-- ==========================================
-- Tabela de Preferências do Usuário
-- ==========================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'pt-BR',
    default_orthanc_server UUID REFERENCES orthanc_servers(id) ON DELETE SET NULL,
    notifications_enabled BOOLEAN DEFAULT true,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ==========================================
-- Índices para Performance
-- ==========================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Access Logs
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON access_logs(action);

-- Orthanc Servers
CREATE INDEX IF NOT EXISTS idx_orthanc_servers_active ON orthanc_servers(is_active);
CREATE INDEX IF NOT EXISTS idx_orthanc_servers_priority ON orthanc_servers(priority DESC);

-- User Preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- ==========================================
-- Triggers
-- ==========================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orthanc_servers_updated_at
    BEFORE UPDATE ON orthanc_servers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Funções Úteis
-- ==========================================

-- Função para autenticar usuário
CREATE OR REPLACE FUNCTION authenticate_user(
    p_username VARCHAR,
    p_password VARCHAR
)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR,
    email VARCHAR,
    full_name VARCHAR,
    role VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.username, u.email, u.full_name, u.role
    FROM users u
    WHERE (u.username = p_username OR u.email = p_username)
      AND u.password_hash = crypt(p_password, u.password_hash)
      AND u.is_active = true;
      
    -- Atualizar last_login
    UPDATE users
    SET last_login = CURRENT_TIMESTAMP
    WHERE (username = p_username OR email = p_username)
      AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar logs antigos (mais de 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM access_logs
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Dados Iniciais
-- ==========================================

-- Usuário administrador padrão
-- Username: admin
-- Password: Admin@123 (MUDAR IMEDIATAMENTE EM PRODUÇÃO!)
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES (
    'admin',
    'admin@bitpacs.local',
    crypt('Admin@123', gen_salt('bf')),
    'Administrador do Sistema',
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- Servidores Orthanc (baseado no vite.config.ts)
INSERT INTO orthanc_servers (name, display_name, url, priority, location, is_active) VALUES
    ('riobranco', 'Rio Branco', 'http://10.31.0.41:8042', 1, 'Rio Branco - AC', true),
    ('foz', 'Foz do Iguaçu', 'http://10.31.0.42:8042', 2, 'Foz do Iguaçu - PR', true),
    ('fazenda', 'Fazenda Rio Grande', 'http://10.31.0.43:8042', 3, 'Fazenda Rio Grande - PR', true),
    ('faxinal', 'Faxinal', 'http://10.31.0.45:8042', 4, 'Faxinal - PR', true),
    ('santamariana', 'Santa Mariana', 'http://10.31.0.46:8042', 5, 'Santa Mariana - PR', true),
    ('guarapuava', 'Guarapuava', 'http://10.31.0.47:8042', 6, 'Guarapuava - PR', true),
    ('carlopolis', 'Carlópolis', 'http://10.31.0.48:8042', 7, 'Carlópolis - PR', true),
    ('arapoti', 'Arapoti', 'http://10.31.0.49:8042', 8, 'Arapoti - PR', true)
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- Views Úteis
-- ==========================================

-- View de usuários ativos
CREATE OR REPLACE VIEW v_active_users AS
SELECT 
    id,
    username,
    email,
    full_name,
    role,
    last_login,
    created_at
FROM users
WHERE is_active = true
ORDER BY created_at DESC;

-- View de servidores ativos
CREATE OR REPLACE VIEW v_active_orthanc_servers AS
SELECT 
    id,
    name,
    display_name,
    url,
    location,
    priority,
    health_status,
    last_health_check
FROM orthanc_servers
WHERE is_active = true
ORDER BY priority ASC;

-- ==========================================
-- Permissões
-- ==========================================

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Usuários da aplicação BitPacs';
COMMENT ON TABLE sessions IS 'Sessões ativas dos usuários';
COMMENT ON TABLE access_logs IS 'Logs de acesso e ações dos usuários';
COMMENT ON TABLE orthanc_servers IS 'Configuração dos servidores Orthanc remotos';
COMMENT ON TABLE user_preferences IS 'Preferências personalizadas dos usuários';

-- Mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BitPacs Database initialized successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Default admin user:';
    RAISE NOTICE '  Username: admin';
    RAISE NOTICE '  Password: Admin@123';
    RAISE NOTICE '  *** CHANGE THIS PASSWORD IMMEDIATELY! ***';
    RAISE NOTICE '========================================';
END $$;
