/*
  Warnings:

  - You are about to alter the column `handle` on the `Post` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(64)`.

*/
-- AlterTable
ALTER TABLE `Post` MODIFY `handle` VARCHAR(64) NOT NULL,
    MODIFY `title` VARCHAR(255) NOT NULL,
    MODIFY `content` TEXT NOT NULL;
