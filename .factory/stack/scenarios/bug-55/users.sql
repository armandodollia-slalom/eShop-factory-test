-- BUG-55 users: copies of bob's row (password Pass123$) that differ only in identity and lockout state.
INSERT INTO public."AspNetUsers" ("Id", "CardNumber", "SecurityNumber", "Expiration", "CardHolderName", "CardType", "Street", "City", "State", "Country", "ZipCode", "Name", "LastName", "UserName", "NormalizedUserName", "Email", "NormalizedEmail", "EmailConfirmed", "PasswordHash", "SecurityStamp", "ConcurrencyStamp", "PhoneNumber", "PhoneNumberConfirmed", "TwoFactorEnabled", "LockoutEnd", "LockoutEnabled", "AccessFailedCount")
SELECT u."Id", b."CardNumber", b."SecurityNumber", b."Expiration", b."CardHolderName", b."CardType", b."Street", b."City", b."State", b."Country", b."ZipCode", b."Name", b."LastName",
       u."UserName", upper(u."UserName"), u."UserName" || '@bug55.example.com', upper(u."UserName" || '@bug55.example.com'), b."EmailConfirmed",
       b."PasswordHash", u."SecurityStamp", u."ConcurrencyStamp", b."PhoneNumber", b."PhoneNumberConfirmed", b."TwoFactorEnabled",
       u."LockoutEnd"::timestamptz, true, 0
FROM public."AspNetUsers" b
CROSS JOIN (VALUES
  -- TC-BUG-55-01: not locked, no failed attempts
  ('55000000-0000-4000-8000-000000000001', 'bug55-retry',   'BUG55RETRYSTAMP000000000000000001', '55000000-0000-4000-8000-0000000000c1', NULL),
  -- TC-BUG-55-02: not locked, no failed attempts
  ('55000000-0000-4000-8000-000000000002', 'bug55-typo',    'BUG55TYPOSTAMP0000000000000000002', '55000000-0000-4000-8000-0000000000c2', NULL),
  -- TC-BUG-55-05: lockout ended in the past
  ('55000000-0000-4000-8000-000000000005', 'bug55-expired', 'BUG55EXPIREDSTAMP000000000000005', '55000000-0000-4000-8000-0000000000c5', '2020-01-01 00:00:00+00'),
  -- TC-BUG-55-06: locked out until 2099
  ('55000000-0000-4000-8000-000000000006', 'bug55-locked',  'BUG55LOCKEDSTAMP0000000000000006', '55000000-0000-4000-8000-0000000000c6', '2099-01-01 00:00:00+00')
) AS u("Id", "UserName", "SecurityStamp", "ConcurrencyStamp", "LockoutEnd")
WHERE b."UserName" = 'bob';
