-- CreateTable
CREATE TABLE `ApplicationTemplate` (
    `templateID` INTEGER NOT NULL AUTO_INCREMENT,
    `applicationType` ENUM('sma_byggeprosjekter', 'sma_byggeprosjekter_med_dispensasjon', 'bruksendring', 'bruksendring_med_dispensasjon', 'melding_om_bygning_tilbygg_unntatt_soknadsplikt', 'melding_om_bygning_tilbygg_unntatt_soknadsplikt_med_dispensasjon') NOT NULL,
    `fields` JSON NOT NULL,

    UNIQUE INDEX `ApplicationTemplate_applicationType_key`(`applicationType`),
    PRIMARY KEY (`templateID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
