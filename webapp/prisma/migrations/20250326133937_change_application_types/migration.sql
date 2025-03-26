/*
  Warnings:

  - The values [melding_om_bygning_tilbygg_unntatt_soknadsplikt] on the enum `requiredField_applicationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [melding_om_bygning_tilbygg_unntatt_soknadsplikt] on the enum `requiredField_applicationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Application` MODIFY `applicationType` ENUM('sma_byggeprosjekter', 'bruksendring') NOT NULL;

-- AlterTable
ALTER TABLE `requiredField` MODIFY `applicationType` ENUM('sma_byggeprosjekter', 'bruksendring') NOT NULL;
