-- INSTK-1 stock set: changes AvailableStock on rows of the demo catalog (no new rows, totals stay 101).
-- Out of stock (AvailableStock 0), 11 items:
--   53 Raven Swift Snowboard, 92 Blizzard Snowboard, 13 Trailblaze hiking backpack (Daybird)
--   5 Blizzard Rider Snowboard (B&R)
--   32 Cosmic Purple Snowboard, 26 Gravity Beam Climbing Rope (Gravitator)
--   4 Expedition Backpack (Quester), 8 Frostbite Insulated Jacket (Grolltex), 9 VenturePro GPS Watch (AirStrider)
--   10 Trailblazer Bike Helmet, 19 EcoTrail Running Shoes (Green Equipment)
UPDATE public."Catalog" SET "AvailableStock" = 0 WHERE "Id" IN (53, 92, 13, 5, 32, 26, 4, 8, 9, 10, 19);
-- Lowest stock that is still in stock (TC-INSTK-1-02 boundary): 71 Explorer Frost Boots (Daybird).
UPDATE public."Catalog" SET "AvailableStock" = 1 WHERE "Id" = 71;
-- Every other item keeps the demo catalog's AvailableStock 100.
UPDATE public."Catalog" SET "AvailableStock" = 100 WHERE "Id" NOT IN (53, 92, 13, 5, 32, 26, 4, 8, 9, 10, 19, 71);
