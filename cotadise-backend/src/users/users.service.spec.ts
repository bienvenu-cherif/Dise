import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';

describe('UsersService - passation du bureau', () => {
  const usersRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as any;
  const levelsRepository = {} as any;
  const auditService = { record: jest.fn() } as any;
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(usersRepository, levelsRepository, auditService);
    usersRepository.save.mockImplementation(async (value: unknown) => value);
  });

  it('retire les droits de gestion et conserve les acces legitimes', async () => {
    const nouveauTresorier = {
      id: 'new-id',
      firstName: 'Nouvelle',
      lastName: 'Tresoriere',
      email: 'nouvelle@example.com',
      role: 'etudiant',
      accountStatus: 'actif',
      isActive: true,
      level: { id: 'ise2', name: 'ISE2' },
    };
    const ancienEtudiant = {
      id: 'old-student',
      firstName: 'Ancien',
      lastName: 'Tresorier',
      email: 'ancien@example.com',
      role: 'tresorier',
      accountStatus: 'actif',
      isActive: true,
      level: { id: 'ise3', name: 'ISE3' },
    };
    const ancienTechnique = {
      id: 'old-admin',
      firstName: 'Admin',
      lastName: 'Technique',
      email: 'admin@example.com',
      role: 'admin',
      accountStatus: 'actif',
      isActive: true,
      level: undefined,
    };
    usersRepository.findOne.mockResolvedValue(nouveauTresorier);
    usersRepository.find.mockResolvedValue([ancienEtudiant, ancienTechnique]);

    const result = await service.passationBureau(
      { nouveauTresorierId: nouveauTresorier.id, motif: 'Nouveau bureau' },
      ancienTechnique.id,
    );

    expect(result.nouveauTresorier.role).toBe('tresorier');
    expect(ancienEtudiant).toMatchObject({ role: 'etudiant', accountStatus: 'actif', isActive: true });
    expect(ancienTechnique).toMatchObject({ role: 'etudiant', accountStatus: 'suspendu', isActive: false });
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'passation_bureau',
        actorId: ancienTechnique.id,
        entityId: nouveauTresorier.id,
      }),
    );
  });

  it('refuse un nouveau tresorier sans niveau ISE', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 'technical-id',
      role: 'admin',
      accountStatus: 'actif',
      isActive: true,
      level: undefined,
    });

    await expect(
      service.passationBureau({ nouveauTresorierId: 'technical-id' }, 'actor-id'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('refuse un mauvais code d activation', async () => {
    const invitedUser = {
      id: 'invite-id',
      email: 'invite@cotadise.local',
      role: 'etudiant',
      accountStatus: 'invite',
      entrySource: 'import_officiel',
      activationCodeHash: await bcrypt.hash('VALIDCODE123', 10),
      activationCodeExpiresAt: new Date(Date.now() + 60000),
    };
    const builder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(invitedUser),
    };
    usersRepository.createQueryBuilder.mockReturnValue(builder);

    await expect(
      service.activateInvitedStudent('invite-id', {
        activationCode: 'WRONGCODE123',
        email: 'student@example.com',
        phone: '+221770000000',
        password: 'Password123!',
      }),
    ).rejects.toThrow('Code d activation incorrect');
    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('active une invitation importee sans code manuel', async () => {
    const invitedUser = {
      id: 'invite-id',
      email: 'invite@cotadise.local',
      role: 'etudiant',
      accountStatus: 'invite',
      entrySource: 'import_officiel',
      level: { id: 'ise2', name: 'ISE2' },
      activationCodeHash: undefined,
      activationCodeExpiresAt: undefined,
    };
    const builder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(invitedUser),
    };
    usersRepository.createQueryBuilder.mockReturnValue(builder);
    usersRepository.findOne.mockResolvedValue(null);
    usersRepository.save.mockImplementation(async (value: any) => ({ ...value }));

    const result = await service.activateInvitedStudent('invite-id', {
      email: 'student@example.com',
      phone: '+221770000000',
      wavePhone: '+221770000001',
      password: 'Password123!',
    });

    expect(result.accountStatus).toBe('actif');
    expect(result.email).toBe('student@example.com');
    expect(result.wavePhone).toBe('+221770000001');
    expect(result.activationCodeHash).toBeUndefined();
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'activation_invitation_autonome',
        actorId: 'invite-id',
        entityId: 'invite-id',
      }),
    );
  });
});
