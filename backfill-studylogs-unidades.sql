-- Backfill de UnidadeNome em StudyLogs (PostgreSQL)
-- Atualiza registros antigos com UnidadeNome NULL ou "Unidade Geral" usando a unidade do usuário.

BEGIN;

WITH unit_map AS (
  SELECT
    u."Id" AS user_id,
    u."UnidadeId" AS unidade_raw,
    CASE
      WHEN u."UnidadeId" IS NULL OR btrim(u."UnidadeId") = '' THEN NULL
      WHEN lower(btrim(u."UnidadeId")) IN ('1', 'riobranco', 'rio branco') THEN 'Rio Branco'
      WHEN lower(btrim(u."UnidadeId")) IN ('2', 'foziguacu', 'foz do iguaçu', 'foz do iguacu') THEN 'Foz do Iguaçu'
      WHEN lower(btrim(u."UnidadeId")) IN ('3', 'fazenda') THEN 'Fazenda'
      WHEN lower(btrim(u."UnidadeId")) IN ('4', 'faxinal') THEN 'Faxinal'
      WHEN lower(btrim(u."UnidadeId")) IN ('5', 'santamariana', 'santa mariana') THEN 'Santa Mariana'
      WHEN lower(btrim(u."UnidadeId")) IN ('6', 'guarapuava') THEN 'Guarapuava'
      WHEN lower(btrim(u."UnidadeId")) IN ('7', 'carlopolis', 'carlópolis') THEN 'Carlópolis'
      WHEN lower(btrim(u."UnidadeId")) IN ('8', 'arapoti') THEN 'Arapoti'
      ELSE btrim(u."UnidadeId")
    END AS unidade_label
  FROM "Users" u
)

-- Logs de visualização/download/estudo: usa a unidade do próprio usuário
UPDATE "StudyLogs" l
SET "UnidadeNome" = m.unidade_label
FROM unit_map m
WHERE (l."UnidadeNome" IS NULL OR lower(btrim(l."UnidadeNome")) IN ('unidade geral', '-', ''))
  AND l."ActionType" IN ('VIEW', 'DOWNLOAD', 'UPLOAD', 'DELETE')
  AND l."UserId" = m.user_id
  AND m.unidade_label IS NOT NULL;

-- Logs administrativos: prioriza unidade do usuário-alvo; se não houver, usa a do autor
UPDATE "StudyLogs" l
SET "UnidadeNome" = m.unidade_label
FROM unit_map m
WHERE (l."UnidadeNome" IS NULL OR lower(btrim(l."UnidadeNome")) IN ('unidade geral', '-', ''))
  AND l."ActionType" IN ('USER_CREATE', 'USER_DELETE', 'PASSWORD_CHANGE', 'PASSWORD_CHANGE_OTHER')
  AND (
    (l."TargetUserId" IS NOT NULL AND l."TargetUserId" = m.user_id)
    OR (l."TargetUserId" IS NULL AND l."UserId" = m.user_id)
  )
  AND m.unidade_label IS NOT NULL;

COMMIT;

-- Verificação rápida
-- SELECT "ActionType", "UnidadeNome", COUNT(*)
-- FROM "StudyLogs"
-- WHERE "UnidadeNome" IS NULL OR lower(btrim("UnidadeNome")) IN ('unidade geral', '-', '')
-- GROUP BY "ActionType", "UnidadeNome"
-- ORDER BY COUNT(*) DESC;
