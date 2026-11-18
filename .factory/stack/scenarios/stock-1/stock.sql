-- STOCK-1: items 1 and 2 are out of stock; every other seeded item keeps AvailableStock 100.
UPDATE public."Catalog" SET "AvailableStock" = 0 WHERE "Id" IN (1, 2);
