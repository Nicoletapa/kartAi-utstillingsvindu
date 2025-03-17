/*
  Warnings:

  - Added the required column `applicationID` to the `application_field` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `application_field` ADD COLUMN `applicationID` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `application_field` ADD CONSTRAINT `application_field_applicationID_fkey` FOREIGN KEY (`applicationID`) REFERENCES `Application`(`applicationID`) ON DELETE RESTRICT ON UPDATE CASCADE;
