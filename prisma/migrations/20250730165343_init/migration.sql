-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('in_progress', 'completed');

-- CreateTable
CREATE TABLE "public"."surveys" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."Status" NOT NULL DEFAULT 'in_progress',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "meter_photos" JSONB,
    "analysis_results" JSONB,
    "survey_responses" JSONB,
    "device_info" JSONB,
    "session_metadata" JSONB,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "surveys_user_id_key" ON "public"."surveys"("user_id");
