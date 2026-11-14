-- carol: a copy of alice's row (same stored hash, so password Pass123$) with her own identity; she has no orders.
CREATE TEMP TABLE carol AS SELECT * FROM public."AspNetUsers" WHERE "UserName" = 'alice';
UPDATE carol SET "Id" = 'c4a01e11-0000-4000-8000-00000000ca01', "Name" = 'Carol', "LastName" = 'Jones', "CardHolderName" = 'Carol Jones',
  "UserName" = 'carol', "NormalizedUserName" = 'CAROL', "Email" = 'CarolJones@email.com', "NormalizedEmail" = 'CAROLJONES@EMAIL.COM',
  "SecurityStamp" = 'CAROLSTAMPCAROLSTAMPCAROLSTAMP00', "ConcurrencyStamp" = 'c4a01e11-0000-4000-8000-00000000ca02';
INSERT INTO public."AspNetUsers" SELECT * FROM carol;
DROP TABLE carol;
