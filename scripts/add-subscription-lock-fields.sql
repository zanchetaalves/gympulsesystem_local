-- Migration: Add lock fields to subscriptions table
-- Data: $(date)
-- Descrição: Adiciona campos para controle de trancamento de matrículas

-- Verificar se os campos já existem antes de adicionar
DO $$ 
BEGIN
    -- Adicionar campo 'locked' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'locked'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN locked BOOLEAN DEFAULT false;
        RAISE NOTICE 'Campo "locked" adicionado à tabela subscriptions';
    ELSE
        RAISE NOTICE 'Campo "locked" já existe na tabela subscriptions';
    END IF;

    -- Adicionar campo 'lock_days' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'lock_days'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN lock_days INTEGER NULL;
        RAISE NOTICE 'Campo "lock_days" adicionado à tabela subscriptions';
    ELSE
        RAISE NOTICE 'Campo "lock_days" já existe na tabela subscriptions';
    END IF;
END $$;

-- Comentários nos campos para documentação
COMMENT ON COLUMN subscriptions.locked IS 'Indica se a matrícula está trancada temporariamente';
COMMENT ON COLUMN subscriptions.lock_days IS 'Quantidade de dias de trancamento a ser adicionada na data de término';

-- Índice para consultas por status de trancamento (opcional, para performance)
CREATE INDEX IF NOT EXISTS idx_subscriptions_locked ON subscriptions(locked) WHERE locked = true;

-- Atualizar registros existentes com valores padrão
UPDATE subscriptions 
SET locked = false 
WHERE locked IS NULL;

UPDATE subscriptions 
SET lock_days = NULL 
WHERE lock_days IS NOT NULL AND locked = false;

-- Verificar a estrutura atualizada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    col_description(pgc.oid, ordinal_position) as column_comment
FROM information_schema.columns isc
LEFT JOIN pg_class pgc ON pgc.relname = isc.table_name
WHERE table_name = 'subscriptions' 
AND table_schema = 'public'
ORDER BY ordinal_position;
