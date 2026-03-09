
UPDATE public.charging_session 
SET status = 'completed', end_time = now(), end_energy = 0, used_energy = 0, cost = 0 
WHERE id = '9ddb0964-fcb9-4d0f-ace2-d8696e97f7dc';

UPDATE public.charger_status SET relay = false WHERE id = 'charger-001';
