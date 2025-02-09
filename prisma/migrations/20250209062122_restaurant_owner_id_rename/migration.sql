/*
  Warnings:

  - You are about to drop the column `restaurantOwnerId` on the `RestaurantOwner` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `RestaurantOwner` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `RestaurantOwner` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RestaurantOwner" DROP CONSTRAINT "RestaurantOwner_restaurantOwnerId_fkey";

-- DropIndex
DROP INDEX "RestaurantOwner_restaurantOwnerId_key";

-- AlterTable
ALTER TABLE "RestaurantOwner" DROP COLUMN "restaurantOwnerId",
ADD COLUMN     "userId" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantOwner_userId_key" ON "RestaurantOwner" ("userId");

-- AddForeignKey
ALTER TABLE "RestaurantOwner"
    ADD CONSTRAINT "RestaurantOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
