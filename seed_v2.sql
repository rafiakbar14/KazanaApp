
-- 1. Insert New Products (retry)
INSERT INTO products (sku, name, category, current_stock, unit_cost, selling_price, user_id, location_type, product_type)
VALUES 
('KWS-002', 'Kopi Walik Susu Gula Aren', 'Minuman', 50, 9000, 18000, '18c1e306-4222-4ebe-b430-41527dbb596c', 'toko', 'finished_good'),
('RBC-003', 'Roti Bakar Keju', 'Makanan', 30, 15000, 25000, '18c1e306-4222-4ebe-b430-41527dbb596c', 'toko', 'finished_good');

-- 2. Create another Sales Transaction
INSERT INTO sales (uuid, invoice_number, total_amount, discount_amount, tax_amount, payment_method, payment_status, user_id, type, created_at)
VALUES 
('manual-seed-uuid-002', 'INV-2024-002', 18000, 0, 0, 'transfer', 'paid', '18c1e306-4222-4ebe-b430-41527dbb596c', 'pos', NOW());

-- Get the last sale id and product id for KWS-002
-- I'll use a subquery to find the newly inserted KWS-002 id
WITH last_sale AS (SELECT id FROM sales WHERE uuid = 'manual-seed-uuid-002'),
     target_product AS (SELECT id FROM products WHERE sku = 'KWS-002' LIMIT 1)
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
SELECT last_sale.id, target_product.id, 1, 18000, 18000 FROM last_sale, target_product;

-- Update stock for KWS-002
UPDATE products SET current_stock = current_stock - 1 WHERE sku = 'KWS-002';

-- 3. Create Accounting Journal Entry for INV-2024-002
INSERT INTO journal_entries (description, reference, user_id, date)
VALUES ('Penjualan POS INV-2024-002', 'INV-2024-002', '18c1e306-4222-4ebe-b430-41527dbb596c', NOW());

-- Insert Journal Items
WITH last_entry AS (SELECT id FROM journal_entries WHERE reference = 'INV-2024-002')
INSERT INTO journal_items (entry_id, account_id, debit, credit, user_id)
SELECT id, 13, 18000, 0, '18c1e306-4222-4ebe-b430-41527dbb596c' FROM last_entry -- Kas (D)
UNION ALL
SELECT id, 20, 0, 18000, '18c1e306-4222-4ebe-b430-41527dbb596c' FROM last_entry -- Pendapatan (C)
UNION ALL
SELECT id, 21, 9000, 0, '18c1e306-4222-4ebe-b430-41527dbb596c' FROM last_entry -- HPP (D)
UNION ALL
SELECT id, 15, 0, 9000, '18c1e306-4222-4ebe-b430-41527dbb596c' FROM last_entry; -- Persediaan (C)
