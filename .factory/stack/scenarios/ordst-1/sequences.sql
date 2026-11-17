-- HiLo sequences (EF Core UseHiLo) are standalone, so the loader does not move them; start them past the seeded ids.
SELECT setval('ordering.orderseq', 200);
SELECT setval('ordering.buyerseq', 100);
SELECT setval('ordering.paymentseq', 100);
SELECT setval('ordering.orderitemseq', 100);
