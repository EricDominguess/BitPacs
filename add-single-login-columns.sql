-- Migration para adicionar campos de single login ao User
-- Execute isso no seu banco de dados

-- Adiciona coluna LastLoginTokenId (nullable)
ALTER TABLE "Users" ADD COLUMN "LastLoginTokenId" VARCHAR(50);

-- Adiciona coluna LastLoginAt (nullable)  
ALTER TABLE "Users" ADD COLUMN "LastLoginAt" TIMESTAMP;

-- Criar índice para melhorar performance nas consultas
CREATE INDEX idx_users_last_login_token ON "Users"("LastLoginTokenId");
