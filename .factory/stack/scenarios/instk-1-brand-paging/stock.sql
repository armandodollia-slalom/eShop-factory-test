-- TC-INSTK-1-18 only: 70 GripTrek Hiking Poles (WildRunner, brand 3, Trekking) out of stock, so WildRunner has
-- 11 products, 10 in stock (two WebApp pages of 9 + 1), and the out-of-stock item sits on page 1 by name.
UPDATE public."Catalog" SET "AvailableStock" = 0 WHERE "Id" = 70;
