import { IncidentEvent } from "@/lib/events/events";
import { NotificationSettings, NotificationProvider as ProviderEnum } from "@prisma/client";

export interface NotificationResult {
  success: boolean;
  recipient?: string;
  errorMessage?: string;
}

export interface NotificationProvider {
  name: ProviderEnum;
  send(event: IncidentEvent, settings: NotificationSettings): Promise<NotificationResult>;
}
