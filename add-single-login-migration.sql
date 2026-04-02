-- Script para adicionar as colunas necessárias para single login
-- Execute isso se o erro disser que as colunas não existem

-- Verificar e adicionar coluna LastLoginTokenId se não existir
IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'LastLoginTokenId'
)
BEGIN
    ALTER TABLE "Users" ADD "LastLoginTokenId" VARCHAR(50);
END

-- Verificar e adicionar coluna LastLoginAt se não existir
IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'LastLoginAt'
)
BEGIN
    ALTER TABLE "Users" ADD "LastLoginAt" TIMESTAMP;
END

-- Criar índice se não existir
IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_NAME = 'Users' AND INDEX_NAME = 'idx_users_last_login_token'
)
BEGIN
    CREATE INDEX idx_users_last_login_token ON "Users"("LastLoginTokenId");
END
