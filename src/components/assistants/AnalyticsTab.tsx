'use client';

import AssistantAnalytics from "@/components/analytics/AssistantAnalytics";

interface AnalyticsTabProps {
  assistantId: string;
}

export default function AnalyticsTab({ assistantId }: AnalyticsTabProps) {
  return <AssistantAnalytics assistantId={assistantId} />;
} 