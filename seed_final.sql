
-- Use the current user ID
-- d7032470-4804-4d5e-98c7-f4ef99e5c63e (rafbarpratama)

-- 1. Insert Products
-- Check if exists first to avoid conflict on KWS-001/002/RBC-003
INSERT INTO products (sku, name, category, current_stock, unit_cost, selling_price, user_id, location_type, product_type)
SELECT 'KWS-001', 'Kopi Walik Susu', 'Minuman', 100, 7500, 15000, 'd7032470-4804-4d5e-98c7-f4ef99e5c63e', 'toko', 'finished_good'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'KWS-001');

INSERT INTO products (sku, name, category, current_stock, unit_cost, selling_price, user_id, location_type, product_type)
SELECT 'KWS-002', 'Kopi Walik Susu Gula Aren', 'Minuman', 50, 9000, 18000, 'd7032470-4804-4d5e-98c7-f4ef99e5c63e', 'toko', 'finished_good'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'KWS-002');

INSERT INTO products (sku, name, category, current_stock, unit_cost, selling_price, user_id, location_type, product_type)
SELECT 'RBC-003', 'Roti Bakar Keju', 'Makanan', 30, 15000, 25000, 'd7032470-4804-4d5e-98c7-f4ef99e5c63e', 'toko', 'finished_good'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'RBC-003');

-- 2. Insert Suppliers
INSERT INTO suppliers (name, contact_person, phone, active, user_id)
VALUES 
('PT Sumber Rezeki', 'Budi', '08123456789', 1, 'd7032470-4804-4d5e-98c7-f4ef99e5c63e'),
('Grosir Sembako Jaya', 'Siti', '08987654321', 1, 'd7032470-4804-4d5e-98c7-f4ef99e5c63e');

-- 3. Create a Sales Transaction
INSERT INTO sales (uuid, invoice_number, total_amount, discount_amount, tax_amount, payment_method, payment_status, user_id, type, created_at)
SELECT 'manual-seed-uuid-final-001', 'INV-2024-001', 30000, 0, 0, 'cash', 'paid', 'd7032470-4804-4d5e-98c7-f4ef99e5c63e', 'pos', NOW()
WHERE NOT EXISTS (SELECT 1 FROM sales WHERE uuid = 'manual-seed-uuid-final-001');

-- Add Sale Items
WITH last_sale AS (SELECT id FROM sales WHERE uuid = 'manual-seed-uuid-final-001'),
     target_product AS (SELECT id FROM products WHERE sku = 'KWS-001' LIMIT 1)
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
SELECT last_sale.id, target_product.id, 2, 15000, 30000 
FROM last_sale, target_product
WHERE NOT EXISTS (SELECT 1 FROM sale_items WHERE sale_id = last_sale.id AND product_id = target_product.id);

-- Update stock
UPDATE products SET current_stock = current_stock - 2 WHERE sku = 'KWS-001';
