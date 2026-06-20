import { BadRequestException } from '@nestjs/common';
import { PaiementsService } from './paiements.service';

describe('PaiementsService - beneficiaire', () => {
  const paiementsRepository = {} as any;
  const cotisationsRepository = { findOne: jest.fn() } as any;
  const usersRepository = { findOne: jest.fn() } as any;
  const waveConfigurationsRepository = {} as any;
  const notificationsService = {} as any;
  const defisService = {} as any;
  const auditService = {} as any;
  let service: PaiementsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaiementsService(
      paiementsRepository,
      cotisationsRepository,
      usersRepository,
      waveConfigurationsRepository,
      notificationsService,
      defisService,
      auditService,
    );
  });

  it('refuse une cotisation obligatoire pour un gestionnaire', async () => {
    const gestionnaire = {
      id: 'manager-id',
      role: 'tresorier',
      accountStatus: 'actif',
      isActive: true,
    };
    cotisationsRepository.findOne.mockResolvedValue({
      id: 'cotisation-id',
      user: gestionnaire,
      amount: 30000,
      paidAmount: 0,
      paid: false,
      status: 'pending',
    });
    usersRepository.findOne.mockResolvedValue(gestionnaire);

    await expect(
      service.create({
        cotisationId: 'cotisation-id',
        userId: gestionnaire.id,
        amount: 5000,
        method: 'Especes',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
