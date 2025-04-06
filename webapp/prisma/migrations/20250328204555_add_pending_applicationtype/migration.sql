-- AlterTable
ALTER TABLE `Application` MODIFY `applicationType` ENUM('sma_byggeprosjekter', 'bruksendring', 'pending') NOT NULL;

-- AlterTable
ALTER TABLE `requiredField` MODIFY `applicationType` ENUM('sma_byggeprosjekter', 'bruksendring', 'pending') NOT NULL;
