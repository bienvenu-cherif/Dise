import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { rowsToXlsxBuffer } from '../common/excel.helper';
import { User } from '../users/user.entity';
import { AuditLog } from './audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async record(dto: CreateAuditLogDto): Promise<AuditLog> {
    const actor = dto.actorId ? await this.usersRepository.findOne({ where: { id: dto.actorId } }) : undefined;
    const log = this.auditRepository.create({
      action: dto.action,
      entityType: dto.entityType,
      entityId: dto.entityId,
      actorType: dto.actorType ?? (actor ? 'user' : 'system'),
      actor: actor ?? undefined,
      details: dto.details,
    });
    return this.auditRepository.save(log);
  }

  findAll(filters: { entityType?: string; entityId?: string; actorId?: string; action?: string } = {}) {
    const query = this.auditRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.actor', 'actor')
      .orderBy('audit.createdAt', 'DESC');

    if (filters.entityType) {
      query.andWhere('audit.entityType = :entityType', { entityType: filters.entityType });
    }
    if (filters.entityId) {
      query.andWhere('audit.entityId = :entityId', { entityId: filters.entityId });
    }
    if (filters.actorId) {
      query.andWhere('actor.id = :actorId', { actorId: filters.actorId });
    }
    if (filters.action) {
      query.andWhere('audit.action = :action', { action: filters.action });
    }

    return query.take(500).getMany();
  }

  async generateExport(filters: { entityType?: string; entityId?: string; actorId?: string; action?: string } = {}) {
    const logs = await this.findAll(filters);
    return rowsToXlsxBuffer(
      logs.map((item) => ({
        ID: item.id,
        Action: item.action,
        Entity: item.entityType,
        'Entity ID': item.entityId || '',
        Actor: item.actor ? `${item.actor.firstName} ${item.actor.lastName}` : item.actorType,
        'Actor Email': item.actor?.email || '',
        Details: item.details ? JSON.stringify(item.details) : '',
        Date: item.createdAt?.toISOString() || '',
      })),
      'Audit',
    );
  }
}
