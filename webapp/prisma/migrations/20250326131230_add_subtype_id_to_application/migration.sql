/*
  Warnings:

  - The values [Ferdig] on the enum `Application_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [sma_byggeprosjekter_med_dispensasjon,bruksendring_med_dispensasjon,melding_om_bygning_tilbygg_unntatt_soknadsplikt_med_dispensasjon] on the enum `requiredField_applicationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [sma_byggeprosjekter_med_dispensasjon,bruksendring_med_dispensasjon,melding_om_bygning_tilbygg_unntatt_soknadsplikt_med_dispensasjon] on the enum `requiredField_applicationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `ApplicationTemplate` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `Application` ADD COLUMN `subTypeId` VARCHAR(191) NULL,
    MODIFY `status` ENUM('Pabegynt', 'Sendt', 'Motatt', 'Under_Behandling', 'Horing', 'Vedtakfattes', 'Endelig_Avgjorelse', 'Ferdig_behandlet') NOT NULL DEFAULT 'Pabegynt',
    MODIFY `applicationType` ENUM('sma_byggeprosjekter', 'bruksendring', 'melding_om_bygning_tilbygg_unntatt_soknadsplikt') NOT NULL;

-- AlterTable
ALTER TABLE `requiredField` MODIFY `applicationType` ENUM('sma_byggeprosjekter', 'bruksendring', 'melding_om_bygning_tilbygg_unntatt_soknadsplikt') NOT NULL;

-- DropTable
DROP TABLE `ApplicationTemplate`;
