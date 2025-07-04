/*
  Warnings:

  - You are about to drop the column `email_date` on the `knowledge_files` table. All the data in the column will be lost.
  - You are about to drop the column `email_from` on the `knowledge_files` table. All the data in the column will be lost.
  - You are about to drop the column `email_integration_id` on the `knowledge_files` table. All the data in the column will be lost.
  - You are about to drop the column `email_labels` on the `knowledge_files` table. All the data in the column will be lost.
  - You are about to drop the column `email_message_id` on the `knowledge_files` table. All the data in the column will be lost.
  - You are about to drop the column `email_subject` on the `knowledge_files` table. All the data in the column will be lost.
  - You are about to drop the column `email_thread_id` on the `knowledge_files` table. All the data in the column will be lost.
  - You are about to drop the column `email_to` on the `knowledge_files` table. All the data in the column will be lost.
  - You are about to drop the `email_integrations` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[stripe_customer_id]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_subscription_id]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DropboxSyncSessionStatus" AS ENUM ('PENDING', 'SYNCING', 'COMPLETED', 'ERROR');

-- CreateEnum
CREATE TYPE "GoogleDriveSyncSessionStatus" AS ENUM ('PENDING', 'SYNCING', 'COMPLETED', 'ERROR');

-- CreateEnum
CREATE TYPE "ConversationPlatform" AS ENUM ('WEBSITE', 'SLACK', 'DISCORD', 'API', 'WORDPRESS', 'MOBILE');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED', 'ERROR');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('RATING', 'THUMBS_UP', 'THUMBS_DOWN', 'COMMENT', 'BUG_REPORT', 'FEATURE_REQUEST');

-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('ACTIVE', 'TRANSFERRED', 'RESOLVED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'HANDOFF_REQUEST');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('CUSTOMER', 'AI_ASSISTANT', 'HUMAN_AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "HandoffReason" AS ENUM ('AI_UNABLE_TO_HELP', 'CUSTOMER_REQUESTED', 'COMPLEX_ISSUE', 'ESCALATION_TRIGGERED', 'SENTIMENT_NEGATIVE', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "HandoffPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "HandoffStatus" AS ENUM ('PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "email_integrations" DROP CONSTRAINT "email_integrations_account_id_fkey";

-- DropForeignKey
ALTER TABLE "knowledge_files" DROP CONSTRAINT "knowledge_files_email_integration_id_fkey";

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "current_period_end" TIMESTAMP(3),
ADD COLUMN     "current_period_start" TIMESTAMP(3),
ADD COLUMN     "stripeCurrentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_subscription_id" TEXT,
ADD COLUMN     "subscription_status" TEXT;

-- AlterTable
ALTER TABLE "assistants" ADD COLUMN     "handoffEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "handoff_settings" JSONB;

-- AlterTable
ALTER TABLE "knowledge_files" DROP COLUMN "email_date",
DROP COLUMN "email_from",
DROP COLUMN "email_integration_id",
DROP COLUMN "email_labels",
DROP COLUMN "email_message_id",
DROP COLUMN "email_subject",
DROP COLUMN "email_thread_id",
DROP COLUMN "email_to";

-- DropTable
DROP TABLE "email_integrations";

-- DropEnum
DROP TYPE "EmailProvider";

-- DropEnum
DROP TYPE "EmailSyncStatus";

-- CreateTable
CREATE TABLE "dropbox_connections" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "dropbox_account_id" TEXT NOT NULL,
    "dropbox_email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dropbox_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dropbox_sync_sessions" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "status" "DropboxSyncSessionStatus" NOT NULL DEFAULT 'PENDING',
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "processed_files" INTEGER NOT NULL DEFAULT 0,
    "error_files" INTEGER NOT NULL DEFAULT 0,
    "synced_files" INTEGER NOT NULL DEFAULT 0,
    "skipped_files" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "dropbox_sync_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_drive_connections" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "google_account_id" TEXT NOT NULL,
    "google_email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_drive_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_drive_sync_sessions" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "status" "GoogleDriveSyncSessionStatus" NOT NULL DEFAULT 'PENDING',
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "processed_files" INTEGER NOT NULL DEFAULT 0,
    "error_files" INTEGER NOT NULL DEFAULT 0,
    "synced_files" INTEGER NOT NULL DEFAULT 0,
    "skipped_files" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "google_drive_sync_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slack_connections" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "assistant_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "team_name" TEXT NOT NULL,
    "team_domain" TEXT,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "bot_token" TEXT NOT NULL,
    "bot_user_id" TEXT NOT NULL,
    "bot_scopes" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_message_at" TIMESTAMP(3),
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slack_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discord_connections" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "assistant_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "guild_name" TEXT NOT NULL,
    "guild_icon" TEXT,
    "bot_token" TEXT NOT NULL,
    "bot_user_id" TEXT,
    "permissions" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_message_at" TIMESTAMP(3),
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discord_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "assistant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "session_id" TEXT,
    "platform" "ConversationPlatform" NOT NULL DEFAULT 'WEBSITE',
    "user_identifier" TEXT,
    "thread_id" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "user_messages" INTEGER NOT NULL DEFAULT 0,
    "assistant_messages" INTEGER NOT NULL DEFAULT 0,
    "avg_response_time" DOUBLE PRECISION,
    "user_satisfaction" DOUBLE PRECISION,
    "has_errors" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "token_count" INTEGER,
    "response_time" DOUBLE PRECISION,
    "openai_message_id" TEXT,
    "error_message" TEXT,
    "has_error" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_analytics" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "assistant_id" TEXT,
    "date" DATE NOT NULL,
    "platform" "ConversationPlatform",
    "total_conversations" INTEGER NOT NULL DEFAULT 0,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "total_user_messages" INTEGER NOT NULL DEFAULT 0,
    "total_assistant_messages" INTEGER NOT NULL DEFAULT 0,
    "unique_users" INTEGER NOT NULL DEFAULT 0,
    "avg_response_time" DOUBLE PRECISION,
    "avg_conversation_length" DOUBLE PRECISION,
    "avg_user_satisfaction" DOUBLE PRECISION,
    "successful_conversations" INTEGER NOT NULL DEFAULT 0,
    "error_conversations" INTEGER NOT NULL DEFAULT 0,
    "error_rate" DOUBLE PRECISION,
    "peak_hour" INTEGER,
    "avg_session_duration" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "popular_queries" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "assistant_id" TEXT,
    "query" TEXT NOT NULL,
    "query_hash" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "avg_response_time" DOUBLE PRECISION,
    "avg_satisfaction" DOUBLE PRECISION,
    "last_asked" TIMESTAMP(3) NOT NULL,
    "is_answered" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "popular_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_feedback" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "message_id" TEXT,
    "account_id" TEXT NOT NULL,
    "assistant_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "feedbackType" "FeedbackType" NOT NULL DEFAULT 'RATING',
    "user_identifier" TEXT,
    "platform" "ConversationPlatform" NOT NULL DEFAULT 'WEBSITE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "human_agents" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "maxChats" INTEGER NOT NULL DEFAULT 5,
    "autoAssign" BOOLEAN NOT NULL DEFAULT true,
    "departments" TEXT[],
    "skills" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "human_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "assistantId" TEXT NOT NULL,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerMetadata" JSONB,
    "status" "ChatStatus" NOT NULL DEFAULT 'ACTIVE',
    "isHandedOff" BOOLEAN NOT NULL DEFAULT false,
    "humanAgentId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'web',
    "sessionStarted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionEnded" TIMESTAMP(3),
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "sender" "MessageSender" NOT NULL,
    "humanAgentId" TEXT,
    "assistantId" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handoff_requests" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "assistantId" TEXT NOT NULL,
    "reason" "HandoffReason" NOT NULL,
    "priority" "HandoffPriority" NOT NULL DEFAULT 'NORMAL',
    "context" TEXT,
    "customerQuery" TEXT,
    "assignedAgentId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "handoffSettings" JSONB NOT NULL,
    "status" "HandoffStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handoff_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dropbox_connections_account_id_dropbox_account_id_key" ON "dropbox_connections"("account_id", "dropbox_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "google_drive_connections_account_id_google_account_id_key" ON "google_drive_connections"("account_id", "google_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "slack_connections_team_id_assistant_id_key" ON "slack_connections"("team_id", "assistant_id");

-- CreateIndex
CREATE UNIQUE INDEX "discord_connections_guild_id_assistant_id_key" ON "discord_connections"("guild_id", "assistant_id");

-- CreateIndex
CREATE INDEX "conversations_assistant_id_created_at_idx" ON "conversations"("assistant_id", "created_at");

-- CreateIndex
CREATE INDEX "conversations_account_id_created_at_idx" ON "conversations"("account_id", "created_at");

-- CreateIndex
CREATE INDEX "conversations_platform_created_at_idx" ON "conversations"("platform", "created_at");

-- CreateIndex
CREATE INDEX "conversation_messages_conversation_id_timestamp_idx" ON "conversation_messages"("conversation_id", "timestamp");

-- CreateIndex
CREATE INDEX "daily_analytics_account_id_date_idx" ON "daily_analytics"("account_id", "date");

-- CreateIndex
CREATE INDEX "daily_analytics_assistant_id_date_idx" ON "daily_analytics"("assistant_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_analytics_account_id_assistant_id_date_platform_key" ON "daily_analytics"("account_id", "assistant_id", "date", "platform");

-- CreateIndex
CREATE INDEX "popular_queries_account_id_count_idx" ON "popular_queries"("account_id", "count");

-- CreateIndex
CREATE INDEX "popular_queries_assistant_id_count_idx" ON "popular_queries"("assistant_id", "count");

-- CreateIndex
CREATE UNIQUE INDEX "popular_queries_account_id_assistant_id_query_hash_key" ON "popular_queries"("account_id", "assistant_id", "query_hash");

-- CreateIndex
CREATE INDEX "user_feedback_assistant_id_created_at_idx" ON "user_feedback"("assistant_id", "created_at");

-- CreateIndex
CREATE INDEX "user_feedback_account_id_created_at_idx" ON "user_feedback"("account_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "human_agents_accountId_userId_key" ON "human_agents"("accountId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "human_agents_userId_key" ON "human_agents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "handoff_requests_sessionId_key" ON "handoff_requests"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_stripe_customer_id_key" ON "accounts"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_stripe_subscription_id_key" ON "accounts"("stripe_subscription_id");

-- AddForeignKey
ALTER TABLE "dropbox_connections" ADD CONSTRAINT "dropbox_connections_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dropbox_sync_sessions" ADD CONSTRAINT "dropbox_sync_sessions_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "dropbox_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_drive_connections" ADD CONSTRAINT "google_drive_connections_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_drive_sync_sessions" ADD CONSTRAINT "google_drive_sync_sessions_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "google_drive_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slack_connections" ADD CONSTRAINT "slack_connections_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slack_connections" ADD CONSTRAINT "slack_connections_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "assistants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discord_connections" ADD CONSTRAINT "discord_connections_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discord_connections" ADD CONSTRAINT "discord_connections_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "assistants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "assistants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_analytics" ADD CONSTRAINT "daily_analytics_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_analytics" ADD CONSTRAINT "daily_analytics_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "assistants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popular_queries" ADD CONSTRAINT "popular_queries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popular_queries" ADD CONSTRAINT "popular_queries_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "assistants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "assistants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "human_agents" ADD CONSTRAINT "human_agents_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "human_agents" ADD CONSTRAINT "human_agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "assistants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_humanAgentId_fkey" FOREIGN KEY ("humanAgentId") REFERENCES "human_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_humanAgentId_fkey" FOREIGN KEY ("humanAgentId") REFERENCES "human_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "assistants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_requests" ADD CONSTRAINT "handoff_requests_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_requests" ADD CONSTRAINT "handoff_requests_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_requests" ADD CONSTRAINT "handoff_requests_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "assistants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_requests" ADD CONSTRAINT "handoff_requests_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "human_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
