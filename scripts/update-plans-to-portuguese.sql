-- Script para atualizar os planos para português
-- Remove os planos antigos em inglês e adiciona os novos em português

-- Primeiro, remove os planos antigos (apenas se existirem)
DELETE FROM plans WHERE name IN ('Plano Básico', 'Plano Premium', 'Plano Anual');

-- Inserir os novos planos em português (apenas se não existirem)
INSERT INTO plans (name, type, price_brl, description, duration_months) 
SELECT 'Mensal', 'Mensal', 79.90, 'Plano mensal da academia', 1
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Mensal')
UNION ALL
SELECT 'Anual', 'Anual', 899.90, 'Plano anual com desconto especial', 12
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Anual')
UNION ALL
SELECT 'Trimestral', 'Trimestral', 300.00, 'Plano trimestral ideal para iniciantes', 3
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Trimestral');

SELECT 'Plans updated to Portuguese successfully!' as message;
