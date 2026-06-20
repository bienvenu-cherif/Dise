export class CreateAuditLogDto {
  action: string;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorType?: string;
  details?: Record<string, unknown>;
}
