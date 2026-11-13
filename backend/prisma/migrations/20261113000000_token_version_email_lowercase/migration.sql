-- AlterTable
ALTER TABLE "users" ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;

-- Normalise emails to lowercase. Rows whose lowercase form already belongs to another
-- account are left untouched (resolve those by hand):
--   SELECT lower(email), count(*) FROM users GROUP BY 1 HAVING count(*) > 1;
UPDATE "users" u
SET "email" = lower(u."email")
WHERE u."email" <> lower(u."email")
  AND NOT EXISTS (
    SELECT 1 FROM "users" o WHERE o."id" <> u."id" AND lower(o."email") = lower(u."email")
  );
