import { BadRequestException } from '@nestjs/common';
import { DefisService } from './defis.service';

describe('DefisService - eligibilite', () => {
  const defisRepository = {} as any;
  const usersRepository = { findOne: jest.fn() } as any;
  const anneesRepository = { findOne: jest.fn() } as any;
  const cotisationsRepository = {} as any;
  const notificationsService = {} as any;
  let service: DefisService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DefisService(
      defisRepository,
      usersRepository,
      anneesRepository,
      cotisationsRepository,
      notificationsService,
    );
  });

  it('interdit de se lancer un defi a soi-meme', async () => {
    await expect(service.create('same-id', { opponentId: 'same-id' })).rejects.toBeInstanceOf(BadRequestException);
    expect(usersRepository.findOne).not.toHaveBeenCalled();
  });

  it('interdit les defis aux gestionnaires', async () => {
    usersRepository.findOne.mockImplementation(async ({ where }: any) => {
      if (where.id === 'manager-id') {
        return { id: 'manager-id', role: 'tresorier', accountStatus: 'actif', isActive: true };
      }
      return { id: 'student-id', role: 'etudiant', accountStatus: 'actif', isActive: true };
    });
    anneesRepository.findOne.mockResolvedValue({ id: 'year-id', active: true, statut: 'ouverte' });

    await expect(service.create('manager-id', { opponentId: 'student-id' })).rejects.toThrow(
      'Cet utilisateur n est pas eligible aux defis de cotisation',
    );
  });
});
