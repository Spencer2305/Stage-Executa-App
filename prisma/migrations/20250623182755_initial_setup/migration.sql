-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "FileProcessingSessionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR');

-- CreateEnum
CREATE TYPE "KnowledgeFileStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'PROCESSED', 'ERROR', 'DELETED');

-- CreateEnum
CREATE TYPE "AssistantStatus" AS ENUM ('DRAFT', 'TRAINING', 'ACTIVE', 'ERROR');

-- CreateEnum
CREATE TYPE "EmailProvider" AS ENUM ('GMAIL', 'OUTLOOK', 'IMAP');

-- CreateEnum
CREATE TYPE "EmailSyncStatus" AS ENUM ('IDLE', 'SYNCING', 'ERROR', 'COMPLETED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "billing_email" TEXT,
    "s3_bucket_name" TEXT,
    "openai_org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "company" TEXT,
    "website" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_processing_sessions" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_name" TEXT,
    "status" "FileProcessingSessionStatus" NOT NULL DEFAULT 'PENDING',
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "processed_files" INTEGER NOT NULL DEFAULT 0,
    "error_files" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_processing_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_files" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "processing_session_id" TEXT,
    "original_name" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "s3_bucket" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" TEXT,
    "checksum" TEXT,
    "status" "KnowledgeFileStatus" NOT NULL DEFAULT 'UPLOADED',
    "email_integration_id" TEXT,
    "email_message_id" TEXT,
    "email_thread_id" TEXT,
    "email_from" TEXT,
    "email_to" TEXT,
    "email_subject" TEXT,
    "email_date" TIMESTAMP(3),
    "email_labels" TEXT,
    "openai_file_id" TEXT,
    "vector_store_id" TEXT,
    "extracted_text" TEXT,
    "text_length" INTEGER,
    "page_count" INTEGER,
    "processing_started_at" TIMESTAMP(3),
    "processing_completed_at" TIMESTAMP(3),
    "processing_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_integrations" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider" "EmailProvider" NOT NULL DEFAULT 'GMAIL',
    "email" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "access_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),
    "total_emails" INTEGER NOT NULL DEFAULT 0,
    "processed_emails" INTEGER NOT NULL DEFAULT 0,
    "sync_status" "EmailSyncStatus" NOT NULL DEFAULT 'IDLE',
    "sync_error" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistants" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "status" "AssistantStatus" NOT NULL DEFAULT 'DRAFT',
    "openai_assistant_id" TEXT,
    "vector_store_id" TEXT,
    "model" TEXT DEFAULT 'gpt-4-turbo',
    "api_key" TEXT,
    "embed_url" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "embed_bubble_color" TEXT DEFAULT '#3B82F6',
    "embed_button_shape" TEXT DEFAULT 'rounded',
    "embed_font_style" TEXT DEFAULT 'system',
    "embed_position" TEXT DEFAULT 'bottom-right',
    "chat_background_color" TEXT DEFAULT '#FFFFFF',
    "user_message_bubble_color" TEXT DEFAULT '#3B82F6',
    "assistant_message_bubble_color" TEXT DEFAULT '#F3F4F6',
    "assistant_font_style" TEXT DEFAULT 'sans',
    "message_bubble_radius" INTEGER DEFAULT 12,
    "show_assistant_avatar" BOOLEAN DEFAULT true,
    "assistant_avatar_url" TEXT,
    "show_chat_header" BOOLEAN DEFAULT true,
    "chat_header_title" TEXT DEFAULT 'AI Assistant',
    "welcome_message" TEXT,
    "total_sessions" INTEGER NOT NULL DEFAULT 0,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_trained" TIMESTAMP(3),

    CONSTRAINT "assistants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_files" (
    "assistant_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_files_pkey" PRIMARY KEY ("assistant_id","file_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_slug_key" ON "accounts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_account_id_key" ON "accounts"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "knowledge_files_account_id_status_idx" ON "knowledge_files"("account_id", "status");

-- CreateIndex
CREATE INDEX "knowledge_files_s3_key_idx" ON "knowledge_files"("s3_key");

-- CreateIndex
CREATE INDEX "knowledge_files_checksum_idx" ON "knowledge_files"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "email_integrations_account_id_email_provider_key" ON "email_integrations"("account_id", "email", "provider");

-- CreateIndex
CREATE INDEX "assistants_account_id_status_idx" ON "assistants"("account_id", "status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_processing_sessions" ADD CONSTRAINT "file_processing_sessions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_files" ADD CONSTRAINT "knowledge_files_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_files" ADD CONSTRAINT "knowledge_files_processing_session_id_fkey" FOREIGN KEY ("processing_session_id") REFERENCES "file_processing_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_files" ADD CONSTRAINT "knowledge_files_email_integration_id_fkey" FOREIGN KEY ("email_integration_id") REFERENCES "email_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_integrations" ADD CONSTRAINT "email_integrations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistants" ADD CONSTRAINT "assistants_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_files" ADD CONSTRAINT "assistant_files_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "assistants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_files" ADD CONSTRAINT "assistant_files_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "knowledge_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
