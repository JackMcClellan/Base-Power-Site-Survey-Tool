-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('in_progress', 'under_review', 'completed');

-- CreateTable
CREATE TABLE "public"."surveys" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."Status" NOT NULL DEFAULT 'in_progress',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "step_data" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "surveys_user_id_key" ON "public"."surveys"("user_id");

