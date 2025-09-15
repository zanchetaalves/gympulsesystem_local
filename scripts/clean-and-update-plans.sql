-- Script para limpar todos os planos e inserir apenas os corretos em português

-- Remove TODOS os planos existentes (cuidado: isso remove todos os dados de planos)
DELETE FROM plans;

-- Inserir apenas os 3 planos corretos em português
INSERT INTO plans (name, type, price_brl, description, duration_months, active, created_at, updated_at) VALUES
('Mensal', 'Mensal', 79.90, 'Plano mensal da academia', 1, true, now(), now()),
('Anual', 'Anual', 899.90, 'Plano anual com desconto especial', 12, true, now(), now()),
('Trimestral', 'Trimestral', 300.00, 'Plano trimestral ideal para iniciantes', 3, true, now(), now());

SELECT 'All plans cleaned and updated to Portuguese successfully!' as message;
