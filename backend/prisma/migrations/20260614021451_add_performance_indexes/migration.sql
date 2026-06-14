-- CreateIndex
CREATE INDEX "posts_like_count_save_count_created_at_idx" ON "posts"("like_count", "save_count", "created_at");

-- CreateIndex
CREATE INDEX "users_follower_count_created_at_idx" ON "users"("follower_count", "created_at");
