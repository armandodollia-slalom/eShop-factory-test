-- EF Core HiLo sequences of Ordering (increment 10): the next block starts past the scenario's ids 1-3.
SELECT setval('ordering.buyerseq', 101);
SELECT setval('ordering.paymentseq', 101);
SELECT setval('ordering.orderseq', 101);
SELECT setval('ordering.orderitemseq', 101);
