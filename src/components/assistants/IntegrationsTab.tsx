'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import IntegrationsManager from "@/components/integrations/IntegrationsManager";

interface IntegrationsTabProps {
  assistantId: string;
}

export default function IntegrationsTab({ assistantId }: IntegrationsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>Integrations</span>
        </CardTitle>
        <CardDescription>
          Connect your assistant to popular platforms and services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <IntegrationsManager assistantId={assistantId} />
      </CardContent>
    </Card>
  );
} 