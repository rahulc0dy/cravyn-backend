-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'DELIVERY_PARTNER', 'RESTAURANT_OWNER', 'RESTAURANT_TEAM', 'MANAGEMENT', 'BUSINESS');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BIKE', 'CYCLE');

-- CreateTable
CREATE TABLE "User"
(
    "id"              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "email"           TEXT         NOT NULL,
    "name"            TEXT         NOT NULL,
    "profileImageUrl" TEXT,
    "role"            "Role"       NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer"
(
    "id"          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "phone"       BIGINT       NOT NULL,
    "userId"      UUID         NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryPartner"
(
    "id"           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    "phone"        BIGINT        NOT NULL,
    "availability" BOOLEAN       NOT NULL DEFAULT false,
    "vehicleType"  "VehicleType" NOT NULL,
    "userId"       UUID          NOT NULL,

    CONSTRAINT "DeliveryPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantOwner"
(
    "id"        UUID   NOT NULL DEFAULT uuid_generate_v4(),
    "phone"     BIGINT NOT NULL,
    "panNumber" TEXT   NOT NULL,
    "userId"    UUID   NOT NULL,

    CONSTRAINT "RestaurantOwner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer" ("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryPartner_userId_key" ON "DeliveryPartner" ("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantOwner_userId_key" ON "RestaurantOwner" ("userId");

-- AddForeignKey
ALTER TABLE "Customer"
    ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryPartner"
    ADD CONSTRAINT "DeliveryPartner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantOwner"
    ADD CONSTRAINT "RestaurantOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
