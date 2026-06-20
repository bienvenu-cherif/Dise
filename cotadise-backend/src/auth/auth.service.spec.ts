import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: '1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  passwordHash: '$2b$10$invalidhash',
  role: 'etudiant',
  accountStatus: 'actif',
  isActive: true,
  level: { id: 'level-1', name: 'ISE1', annualAmount: 30000 },
};

describe('AuthService', () => {
  let service: AuthService;
  const usersRepo = {
    findOne: jest.fn(),
  } as any;
  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
  } as any;
  const emailOutboxService = {
    queueRawEmail: jest.fn(),
  } as any;

  beforeEach(() => {
    service = new AuthService(usersRepo, jwtService, emailOutboxService);
    usersRepo.findOne.mockReset();
    jwtService.sign.mockClear();
  });

  it('validateUser returns user when credentials are valid', async () => {
    const hash = await bcrypt.hash('password', 10);
    usersRepo.findOne.mockResolvedValue({ ...mockUser, passwordHash: hash });

    const user = await service.validateUser('test@example.com', 'password');
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });

  it('login returns accessToken and user payload', async () => {
    const hash = await bcrypt.hash('password', 10);
    usersRepo.findOne.mockResolvedValue({ ...mockUser, passwordHash: hash });

    const result = await service.login({ identifier: 'test@example.com', password: 'password' } as any);
    expect(result).toHaveProperty('accessToken', 'signed-token');
    expect(result).toHaveProperty('user');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.level?.name).toBe('ISE1');
  });
});
