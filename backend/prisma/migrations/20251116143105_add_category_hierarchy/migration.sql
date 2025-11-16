-- AlterTable
ALTER TABLE "categories" ADD COLUMN "parent_id" TEXT;

-- DropIndex
DROP INDEX IF EXISTS "categories_user_id_name_key";

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_user_id_name_parent_id_key" ON "categories"("user_id", "name", "parent_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

