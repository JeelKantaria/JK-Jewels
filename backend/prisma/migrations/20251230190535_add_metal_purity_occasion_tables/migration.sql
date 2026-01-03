-- CreateTable
CREATE TABLE "metal_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metal_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metal_type" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occasions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occasions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "metal_types_name_key" ON "metal_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "purities_name_key" ON "purities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "occasions_name_key" ON "occasions"("name");
