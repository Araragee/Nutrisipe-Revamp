-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "servings" INTEGER,
    "prep_time" INTEGER,
    "cook_time" INTEGER,
    "total_time" INTEGER,
    "difficulty" VARCHAR(20),
    "ingredients" JSONB NOT NULL,
    "instructions" JSONB NOT NULL,
    "nutrition" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recipes_post_id_key" ON "recipes"("post_id");

-- CreateIndex
CREATE INDEX "recipes_post_id_idx" ON "recipes"("post_id");

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
