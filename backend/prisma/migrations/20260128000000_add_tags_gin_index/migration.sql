CREATE INDEX "posts_tags_idx" ON "posts" USING GIN ("tags");
