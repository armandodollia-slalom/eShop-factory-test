-- HINT-1: alice's three OrderPaid subscriptions (see scenario.yaml for what each row is for).
INSERT INTO public."Subscriptions" ("Id", "Type", "Date", "DestUrl", "Token", "UserId") VALUES
  (9101, 3, '2026-11-01 10:00:00+00', 'http://receiver.test/long', 'fake-token-3c4d', '50ddac7e-9b69-4d68-a91b-25100ef2e403'),
  (9102, 3, '2026-11-01 11:00:00+00', 'http://receiver.test/short', 'wxyz', '50ddac7e-9b69-4d68-a91b-25100ef2e403'),
  (9103, 3, '2026-11-01 12:00:00+00', 'http://receiver.test/none', NULL, '50ddac7e-9b69-4d68-a91b-25100ef2e403');
-- A webhook registered during a case gets the next id instead of colliding with the fixed ones.
SELECT setval(pg_get_serial_sequence('public."Subscriptions"', 'Id'), 9103);
