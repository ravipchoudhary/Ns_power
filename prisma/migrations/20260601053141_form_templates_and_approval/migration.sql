-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formKind" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formTemplateId" TEXT,
    "formDataJson" TEXT NOT NULL DEFAULT '{}',
    "propertyId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "adminNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "inspectionDate" DATETIME,
    "lastInspectionDate" DATETIME,
    "buildingName" TEXT NOT NULL,
    "buildingAddress" TEXT NOT NULL,
    "contactPerson" TEXT,
    "contactAddress" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "buildingType" TEXT,
    "pumpMake" TEXT,
    "driveType" TEXT,
    "modelNo" TEXT,
    "gpm" REAL,
    "psi" REAL,
    "rpm" REAL,
    "feedingJson" TEXT NOT NULL DEFAULT '{}',
    "checklistJson" TEXT NOT NULL DEFAULT '[]',
    "satisfactory" BOOLEAN,
    "failureReason" TEXT,
    "notes" TEXT,
    "inspectorName" TEXT,
    "approvalDate" DATETIME,
    "signatureData" TEXT,
    "customerSignatureData" TEXT,
    "pdfPath" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspection_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "FormTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspection_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspection_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inspection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Inspection" ("approvalDate", "assignedToId", "buildingAddress", "buildingName", "buildingType", "checklistJson", "contactAddress", "contactPerson", "createdAt", "createdById", "driveType", "email", "failureReason", "fax", "feedingJson", "gpm", "id", "inspectionDate", "inspectorName", "lastInspectionDate", "modelNo", "notes", "pdfPath", "phone", "propertyId", "psi", "pumpMake", "rpm", "satisfactory", "signatureData", "status", "submittedAt", "updatedAt") SELECT "approvalDate", "assignedToId", "buildingAddress", "buildingName", "buildingType", "checklistJson", "contactAddress", "contactPerson", "createdAt", "createdById", "driveType", "email", "failureReason", "fax", "feedingJson", "gpm", "id", "inspectionDate", "inspectorName", "lastInspectionDate", "modelNo", "notes", "pdfPath", "phone", "propertyId", "psi", "pumpMake", "rpm", "satisfactory", "signatureData", "status", "submittedAt", "updatedAt" FROM "Inspection";
DROP TABLE "Inspection";
ALTER TABLE "new_Inspection" RENAME TO "Inspection";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "FormTemplate_slug_key" ON "FormTemplate"("slug");
