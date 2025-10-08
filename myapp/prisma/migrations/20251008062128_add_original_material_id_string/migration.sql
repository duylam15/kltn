/*
  Warnings:

  - A unique constraint covering the columns `[originalMaterialId]` on the table `Material` will be added. If there are existing duplicate values, this will fail.
  - Made the column `originalMaterialId` on table `Material` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Material" ALTER COLUMN "originalMaterialId" SET NOT NULL,
ALTER COLUMN "originalMaterialId" SET DATA TYPE VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "Material_originalMaterialId_key" ON "public"."Material"("originalMaterialId");
