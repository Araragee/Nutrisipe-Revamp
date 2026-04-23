-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "is_variation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "variation_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "recipe_variations" (
    "id" TEXT NOT NULL,
    "original_post_id" TEXT NOT NULL,
    "variation_post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_variations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recipe_variations_variation_post_id_key" ON "recipe_variations"("variation_post_id");

-- CreateIndex
CREATE INDEX "recipe_variations_original_post_id_idx" ON "recipe_variations"("original_post_id");

-- CreateIndex
CREATE INDEX "recipe_variations_variation_post_id_idx" ON "recipe_variations"("variation_post_id");

-- CreateIndex
CREATE INDEX "recipe_variations_user_id_idx" ON "recipe_variations"("user_id");

-- CreateIndex
CREATE INDEX "recipe_variations_created_at_idx" ON "recipe_variations"("created_at");

-- AddForeignKey
ALTER TABLE "recipe_variations" ADD CONSTRAINT "recipe_variations_original_post_id_fkey" FOREIGN KEY ("original_post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_variations" ADD CONSTRAINT "recipe_variations_variation_post_id_fkey" FOREIGN KEY ("variation_post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_variations" ADD CONSTRAINT "recipe_variations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
