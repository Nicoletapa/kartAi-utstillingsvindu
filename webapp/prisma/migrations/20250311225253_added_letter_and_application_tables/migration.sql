/*
  Warnings:

  - You are about to drop the column `address` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `municipality` on the `Application` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `Application` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(2))`.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - Added the required column `applicationType` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedDate` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `DocumentValidation` DROP FOREIGN KEY `DocumentValidation_documentID_fkey`;

-- AlterTable
ALTER TABLE `Application` DROP COLUMN `address`,
    DROP COLUMN `municipality`,
    ADD COLUMN `applicationType` ENUM('bygge_tilbygg_mindre_enn_50kvm', 'rive_tilbygg_mindre_enn_50kvm', 'bygge_frittliggende_bygning_mindre_70kvm', 'rive_frittliggende_bygning_mindre_70kvm', 'bruksendring', 'bygge_vanlige_driftsbygninger_for_landbruket_mindre_1000m2', 'endre_vanlige_driftsbygninger_for_landbruket_mindre_1000m2', 'rive_vanlige_driftsbygninger_for_landbruket_mindre_1000m2', 'melding_om_bygning_unntatt_soknadsplikt', 'melding_om_tilbygg_unntatt_soknadsplikt') NOT NULL,
    ADD COLUMN `updatedDate` DATETIME(0) NOT NULL,
    MODIFY `status` ENUM('Pabegynt', 'Ferdig', 'Sendt') NOT NULL DEFAULT 'Pabegynt';

-- AlterTable
ALTER TABLE `User` DROP COLUMN `image`,
    ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `bnr` INTEGER NULL,
    ADD COLUMN `fnr` INTEGER NULL,
    ADD COLUMN `gnr` INTEGER NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `postalArea` VARCHAR(191) NULL,
    ADD COLUMN `postalCode` VARCHAR(191) NULL,
    ADD COLUMN `snr` INTEGER NULL;

-- CreateTable
CREATE TABLE `requiredField` (
    `requiredFiledID` INTEGER NOT NULL AUTO_INCREMENT,
    `applicationType` ENUM('bygge_tilbygg_mindre_enn_50kvm', 'rive_tilbygg_mindre_enn_50kvm', 'bygge_frittliggende_bygning_mindre_70kvm', 'rive_frittliggende_bygning_mindre_70kvm', 'bruksendring', 'bygge_vanlige_driftsbygninger_for_landbruket_mindre_1000m2', 'endre_vanlige_driftsbygninger_for_landbruket_mindre_1000m2', 'rive_vanlige_driftsbygninger_for_landbruket_mindre_1000m2', 'melding_om_bygning_unntatt_soknadsplikt', 'melding_om_tilbygg_unntatt_soknadsplikt') NOT NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `fieldDescription` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`requiredFiledID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Letter` (
    `letterID` INTEGER NOT NULL AUTO_INCREMENT,
    `applicationID` INTEGER NOT NULL,
    `recipientName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`letterID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LetterField` (
    `letterFieldID` INTEGER NOT NULL AUTO_INCREMENT,
    `letterID` INTEGER NOT NULL,
    `filedName` VARCHAR(191) NOT NULL,
    `fieldValue` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`letterFieldID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_field` (
    `application_fieldID` INTEGER NOT NULL AUTO_INCREMENT,
    `fieldName` TEXT NOT NULL,
    `fieltdValue` TEXT NOT NULL,
    `createdDate` DATETIME(0) NOT NULL,
    `updatedDate` DATETIME(0) NOT NULL,

    PRIMARY KEY (`application_fieldID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Letter` ADD CONSTRAINT `Letter_applicationID_fkey` FOREIGN KEY (`applicationID`) REFERENCES `Application`(`applicationID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LetterField` ADD CONSTRAINT `LetterField_letterID_fkey` FOREIGN KEY (`letterID`) REFERENCES `Letter`(`letterID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentValidation` ADD CONSTRAINT `DocumentValidation_documentID_fkey` FOREIGN KEY (`documentID`) REFERENCES `Document`(`documentID`) ON DELETE CASCADE ON UPDATE CASCADE;
