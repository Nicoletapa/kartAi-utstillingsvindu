/*
  Warnings:

  - The values [bygge_tilbygg_mindre_enn_50kvm,rive_tilbygg_mindre_enn_50kvm,bygge_frittliggende_bygning_mindre_70kvm,rive_frittliggende_bygning_mindre_70kvm,bygge_vanlige_driftsbygninger_for_landbruket_mindre_1000m2,endre_vanlige_driftsbygninger_for_landbruket_mindre_1000m2,rive_vanlige_driftsbygninger_for_landbruket_mindre_1000m2,melding_om_bygning_unntatt_soknadsplikt,melding_om_tilbygg_unntatt_soknadsplikt] on the enum `requiredField_applicationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `fieltdValue` on the `application_field` table. All the data in the column will be lost.
  - The values [bygge_tilbygg_mindre_enn_50kvm,rive_tilbygg_mindre_enn_50kvm,bygge_frittliggende_bygning_mindre_70kvm,rive_frittliggende_bygning_mindre_70kvm,bygge_vanlige_driftsbygninger_for_landbruket_mindre_1000m2,endre_vanlige_driftsbygninger_for_landbruket_mindre_1000m2,rive_vanlige_driftsbygninger_for_landbruket_mindre_1000m2,melding_om_bygning_unntatt_soknadsplikt,melding_om_tilbygg_unntatt_soknadsplikt] on the enum `requiredField_applicationType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `fieldValue` to the `application_field` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Application` MODIFY `applicationType` ENUM('sma_byggeprosjekter', 'sma_byggeprosjekter_med_dispensasjon', 'bruksendring', 'bruksendring_med_dispensasjon', 'melding_om_bygning_tilbygg_unntatt_soknadsplikt', 'melding_om_bygning_tilbygg_unntatt_soknadsplikt_med_dispensasjon') NOT NULL;

-- AlterTable
ALTER TABLE `application_field` DROP COLUMN `fieltdValue`,
    ADD COLUMN `fieldValue` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `requiredField` MODIFY `applicationType` ENUM('sma_byggeprosjekter', 'sma_byggeprosjekter_med_dispensasjon', 'bruksendring', 'bruksendring_med_dispensasjon', 'melding_om_bygning_tilbygg_unntatt_soknadsplikt', 'melding_om_bygning_tilbygg_unntatt_soknadsplikt_med_dispensasjon') NOT NULL;
