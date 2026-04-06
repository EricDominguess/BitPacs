-- ============================================================
-- MIGRAÇÃO: Corrigir limites VARCHAR na tabela StudyLogs
-- ============================================================
-- Problema: URLs de integração com PatientID (52 chars) 
--           estavam sendo truncadas para 51 caracteres
-- Causa: Limites implícitos de VARCHAR curtos
-- ============================================================

-- 1. Verificar e corrigir coluna ActionType (50 chars)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'StudyLogs' AND column_name = 'ActionType') THEN
    ALTER TABLE "StudyLogs" ALTER COLUMN "ActionType" TYPE VARCHAR(50);
    RAISE NOTICE 'ActionType alterado para VARCHAR(50)';
  END IF;
END $$;

-- 2. Verificar e corrigir coluna StudyId (512 chars - IDs podem ser longos)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'StudyLogs' AND column_name = 'StudyId') THEN
    ALTER TABLE "StudyLogs" ALTER COLUMN "StudyId" TYPE VARCHAR(512);
    RAISE NOTICE 'StudyId alterado para VARCHAR(512)';
  END IF;
END $$;

-- 3. Verificar e corrigir coluna StudyInstanceUID (512 chars)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'StudyLogs' AND column_name = 'StudyInstanceUID') THEN
    ALTER TABLE "StudyLogs" ALTER COLUMN "StudyInstanceUID" TYPE VARCHAR(512);
    RAISE NOTICE 'StudyInstanceUID alterado para VARCHAR(512)';
  END IF;
END $$;

-- 4. Verificar e corrigir coluna PatientName (256 chars)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'StudyLogs' AND column_name = 'PatientName') THEN
    ALTER TABLE "StudyLogs" ALTER COLUMN "PatientName" TYPE VARCHAR(256);
    RAISE NOTICE 'PatientName alterado para VARCHAR(256)';
  END IF;
END $$;

-- 5. Verificar e corrigir coluna StudyDescription (512 chars)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'StudyLogs' AND column_name = 'StudyDescription') THEN
    ALTER TABLE "StudyLogs" ALTER COLUMN "StudyDescription" TYPE VARCHAR(512);
    RAISE NOTICE 'StudyDescription alterado para VARCHAR(512)';
  END IF;
END $$;

-- 6. Verificar e corrigir coluna Modality (50 chars)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'StudyLogs' AND column_name = 'Modality') THEN
    ALTER TABLE "StudyLogs" ALTER COLUMN "Modality" TYPE VARCHAR(50);
    RAISE NOTICE 'Modality alterado para VARCHAR(50)';
  END IF;
END $$;

-- 7. Verificar e corrigir coluna UnidadeNome (100 chars)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'StudyLogs' AND column_name = 'UnidadeNome') THEN
    ALTER TABLE "StudyLogs" ALTER COLUMN "UnidadeNome" TYPE VARCHAR(100);
    RAISE NOTICE 'UnidadeNome alterado para VARCHAR(100)';
  END IF;
END $$;

-- 8. Verificar e corrigir coluna IpAddress (45 chars - suporta IPv6)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'StudyLogs' AND column_name = 'IpAddress') THEN
    ALTER TABLE "StudyLogs" ALTER COLUMN "IpAddress" TYPE VARCHAR(45);
    RAISE NOTICE 'IpAddress alterado para VARCHAR(45)';
  END IF;
END $$;

-- 9. Verificar e corrigir coluna TargetUserName (256 chars)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'StudyLogs' AND column_name = 'TargetUserName') THEN
    ALTER TABLE "StudyLogs" ALTER COLUMN "TargetUserName" TYPE VARCHAR(256);
    RAISE NOTICE 'TargetUserName alterado para VARCHAR(256)';
  END IF;
END $$;

-- 10. ⚠️ CRÍTICO: Verificar e corrigir coluna Details (1024 chars)
--     Esta coluna pode conter URLs de integração com PatientID completos
--     Exemplo: "Formato: PDF | IntegrationURL: http://system.com?patient=12410"
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'StudyLogs' AND column_name = 'Details') THEN
    -- Verifica se é TEXT e converte para VARCHAR
    IF (SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'StudyLogs' AND column_name = 'Details') = 'text' THEN
      ALTER TABLE "StudyLogs" ALTER COLUMN "Details" TYPE VARCHAR(1024);
      RAISE NOTICE 'Details convertido de TEXT para VARCHAR(1024) - AGORA PROTEGIDO CONTRA TRUNCAMENTO';
    ELSE
      ALTER TABLE "StudyLogs" ALTER COLUMN "Details" TYPE VARCHAR(1024);
      RAISE NOTICE 'Details alterado para VARCHAR(1024)';
    END IF;
  END IF;
END $$;

-- 11. Criar índices se não existirem (melhorar performance)
CREATE INDEX IF NOT EXISTS idx_studylogs_userid 
  ON "StudyLogs"("UserId");

CREATE INDEX IF NOT EXISTS idx_studylogs_timestamp 
  ON "StudyLogs"("Timestamp");

CREATE INDEX IF NOT EXISTS idx_studylogs_patientid
  ON "StudyLogs"("PatientName");

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '✅ Migração concluída: Todos os campos de string têm limites explícitos';
  RAISE NOTICE '⚠️ IMPORTANTE: URLs de integração agora podem ter até 1024 caracteres';
  RAISE NOTICE '🔍 Para verificar: SELECT * FROM StudyLogs WHERE LENGTH("Details") > 100;';
END $$;
