-- CreateTable
CREATE TABLE `DocumentValidation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documentID` INTEGER NOT NULL,
    `drawingType` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DocumentValidation_documentID_drawingType_key`(`documentID`, `drawingType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DocumentValidation` ADD CONSTRAINT `DocumentValidation_documentID_fkey` FOREIGN KEY (`documentID`) REFERENCES `Document`(`documentID`) ON DELETE RESTRICT ON UPDATE CASCADE;
