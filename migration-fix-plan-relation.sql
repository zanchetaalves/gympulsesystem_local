-- Migration: Fix subscription plan relation
-- Remove plan TEXT column and use only plan_id FK

-- Step 1: Verify current data
SELECT 
    s.id,
    s.plan as current_plan_text,
    s.plan_id as current_plan_id,
    p.name as plan_name_from_id
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
LIMIT 10;

-- Step 2: Update plan_id based on plan text (if needed)
-- This assumes you have plans with matching names
UPDATE subscriptions 
SET plan_id = (
    SELECT p.id 
    FROM plans p 
    WHERE LOWER(p.name) = LOWER(subscriptions.plan)
    LIMIT 1
)
WHERE plan_id IS NULL;

-- Step 3: Remove the plan TEXT column
ALTER TABLE subscriptions DROP COLUMN IF EXISTS plan;

-- Step 4: Verify the fix
SELECT 
    s.id,
    s.plan_id,
    p.name as plan_name,
    p.price_brl,
    c.name as client_name
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
JOIN clients c ON s.client_id = c.id
LIMIT 5;
