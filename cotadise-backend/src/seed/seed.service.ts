import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { Cotisation } from '../cotisations/cotisation.entity';
import { Defi } from '../defis/defi.entity';
import { DonAlumni } from '../dons/don-alumni.entity';
import { InscriptionAnnuelle } from '../inscriptions-annuelles/inscription-annuelle.entity';
import { LevelsService } from '../levels/levels.service';
import { AcademicLevel } from '../levels/academic-level.entity';
import { MontantCotisation } from '../montants-cotisation/montant-cotisation.entity';
import { Paiement } from '../paiements/paiement.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly levelsService: LevelsService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AcademicLevel)
    private readonly levelsRepository: Repository<AcademicLevel>,
    @InjectRepository(AnneeAcademique)
    private readonly anneesRepository: Repository<AnneeAcademique>,
    @InjectRepository(InscriptionAnnuelle)
    private readonly inscriptionsRepository: Repository<InscriptionAnnuelle>,
    @InjectRepository(MontantCotisation)
    private readonly montantsRepository: Repository<MontantCotisation>,
    @InjectRepository(Cotisation)
    private readonly cotisationsRepository: Repository<Cotisation>,
    @InjectRepository(Paiement)
    private readonly paiementsRepository: Repository<Paiement>,
    @InjectRepository(Defi)
    private readonly defisRepository: Repository<Defi>,
    @InjectRepository(DonAlumni)
    private readonly donsRepository: Repository<DonAlumni>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultLevels();
    await this.seedDemoData();

    const adminEmail = this.configService.get<string>('ADMIN_EMAIL', 'admin@cotadise.local');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD', 'Admin123!');

    const existingAdmin = await this.usersService.findByEmail(adminEmail);
    if (existingAdmin) {
      this.logger.log(`Admin user already exists: ${adminEmail}`);
      return;
    }

    this.logger.log(`Creating initial admin user: ${adminEmail}`);
    await this.usersService.create(
      {
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: adminPassword,
      },
      'admin',
    );
    this.logger.log('Initial admin user created successfully');
  }

  private async seedDefaultLevels(): Promise<void> {
    const existingLevels = await this.levelsService.findAll();
    const existingNames = new Set(existingLevels.map((level) => level.name.toLowerCase()));
    const defaultLevels = [
      { name: 'ISE1', description: 'Premiere annee ISE', annualAmount: 0 },
      { name: 'ISE2', description: 'Deuxieme annee ISE', annualAmount: 0 },
      { name: 'ISE3', description: 'Troisieme annee ISE', annualAmount: 0 },
      { name: 'alumni', description: 'Anciens etudiants, non eligibles aux cotisations obligatoires', annualAmount: 0 },
    ];

    for (const level of defaultLevels) {
      if (!existingNames.has(level.name.toLowerCase())) {
        await this.levelsService.create(level);
        this.logger.log(`Default level created: ${level.name}`);
      }
    }
  }

  private async seedDemoData(): Promise<void> {
    if (this.configService.get<string>('DEMO_SEED_ENABLED') !== 'true') {
      return;
    }

    const alreadySeeded = await this.usersService.findByEmail('ise1.alpha@cotadise.test');
    if (alreadySeeded) {
      this.logger.log('Demo data already exists');
      return;
    }

    this.logger.log('Creating CotaDISE demo data');

    const levels = await this.ensureDemoLevels();
    const annee = await this.ensureDemoAcademicYear();
    await this.ensureDemoMontants(annee, levels);

    const tresorier = await this.ensureDemoUser({
      firstName: 'Mamadou',
      lastName: 'Tresorier',
      email: 'tresorier@cotadise.test',
      password: 'Tresorier123!',
      phone: '+221770000001',
      wavePhone: '+221770000001',
      role: 'tresorier',
      accountStatus: 'actif',
      entrySource: 'demo',
    });

    const alphaIse1 = await this.ensureDemoUser({
      firstName: 'Aminata',
      lastName: 'Ndiaye',
      email: 'ise1.alpha@cotadise.test',
      password: 'Etudiant123!',
      phone: '+221770000101',
      wavePhone: '+221770000101',
      levelId: levels.ISE1.id,
      role: 'etudiant',
      accountStatus: 'actif',
      entrySource: 'import_officiel',
    });

    const betaIse1 = await this.ensureDemoUser({
      firstName: 'Cheikh',
      lastName: 'Diop',
      email: 'ise1.beta@cotadise.test',
      password: 'Etudiant123!',
      phone: '+221770000102',
      wavePhone: '+221770000102',
      levelId: levels.ISE1.id,
      role: 'etudiant',
      accountStatus: 'actif',
      entrySource: 'import_officiel',
    });

    const inviteIse1 = await this.ensureDemoUser({
      firstName: 'Awa',
      lastName: 'Fall',
      email: 'awa.fall.invite@cotadise.test',
      password: 'Invite123!',
      phone: '+221770000103',
      wavePhone: '+221770000103',
      levelId: levels.ISE1.id,
      role: 'etudiant',
      accountStatus: 'invite',
      entrySource: 'import_officiel',
    });
    if (inviteIse1.accountStatus === 'invite') {
      inviteIse1.activationCodeHash = await bcrypt.hash('DEMO2026ISE1', 10);
      inviteIse1.activationCodeExpiresAt = new Date('2030-12-31T23:59:59Z');
      await this.usersRepository.save(inviteIse1);
    }

    const alphaIse2 = await this.ensureDemoUser({
      firstName: 'Ibrahima',
      lastName: 'Ba',
      email: 'ise2.alpha@cotadise.test',
      password: 'Etudiant123!',
      phone: '+221770000201',
      wavePhone: '+221770000201',
      levelId: levels.ISE2.id,
      role: 'etudiant',
      accountStatus: 'actif',
      entrySource: 'demo',
    });

    const alphaIse3 = await this.ensureDemoUser({
      firstName: 'Fatou',
      lastName: 'Sarr',
      email: 'ise3.alpha@cotadise.test',
      password: 'Etudiant123!',
      phone: '+221770000301',
      wavePhone: '+221770000301',
      levelId: levels.ISE3.id,
      role: 'etudiant',
      accountStatus: 'actif',
      entrySource: 'demo',
    });

    const alumni = await this.ensureDemoUser({
      firstName: 'Ousmane',
      lastName: 'Kane',
      email: 'alumni.2026@cotadise.test',
      password: 'Alumni123!',
      phone: '+221770000401',
      wavePhone: '+221770000401',
      levelId: levels.alumni.id,
      role: 'etudiant',
      accountStatus: 'alumni',
      entrySource: 'demo',
      promotionSortante: 'Promotion 2026',
    });

    await this.ensureDemoInscription(alphaIse1, annee, levels.ISE1, true, 'actif');
    await this.ensureDemoInscription(betaIse1, annee, levels.ISE1, true, 'actif');
    await this.ensureDemoInscription(inviteIse1, annee, levels.ISE1, true, 'actif');
    await this.ensureDemoInscription(alphaIse2, annee, levels.ISE2, true, 'actif');
    await this.ensureDemoInscription(alphaIse3, annee, levels.ISE3, true, 'actif');
    await this.ensureDemoInscription(alumni, annee, levels.alumni, false, 'alumni');

    const cotisationAlphaIse1 = await this.ensureDemoCotisation(alphaIse1, annee, 30000, 5000, 'pending');
    const cotisationBetaIse1 = await this.ensureDemoCotisation(betaIse1, annee, 30000, 15000, 'partial');
    await this.ensureDemoCotisation(inviteIse1, annee, 30000, 0, 'pending');
    await this.ensureDemoCotisation(alphaIse2, annee, 35000, 12000, 'partial');
    await this.ensureDemoCotisation(alphaIse3, annee, 40000, 40000, 'paid');

    await this.ensureDemoPaiement(cotisationAlphaIse1, alphaIse1, alphaIse1, tresorier, 5000, 'demo-main-001', 'main_a_main');
    await this.ensureDemoPaiement(cotisationBetaIse1, betaIse1, alphaIse1, tresorier, 15000, 'demo-ami-001', 'paiement_pour_camarade');
    await this.ensureDemoDefi(alphaIse1, betaIse1, annee);
    await this.ensureDemoDon(alumni, tresorier);

    this.logger.log('CotaDISE demo data created successfully');
  }

  private async ensureDemoLevels(): Promise<Record<'ISE1' | 'ISE2' | 'ISE3' | 'alumni', AcademicLevel>> {
    const levels = await this.levelsRepository.find();
    const byName = new Map(levels.map((level) => [level.name, level]));
    return {
      ISE1: byName.get('ISE1')!,
      ISE2: byName.get('ISE2')!,
      ISE3: byName.get('ISE3')!,
      alumni: byName.get('alumni')!,
    };
  }

  private async ensureDemoAcademicYear(): Promise<AnneeAcademique> {
    const existing = await this.anneesRepository.findOne({ where: { libelle: '2026-2027' } });
    if (existing) {
      return existing;
    }
    return this.anneesRepository.save(
      this.anneesRepository.create({
        libelle: '2026-2027',
        dateDebut: '2026-10-01',
        dateFin: '2027-08-31',
        statut: 'ouverte',
        active: true,
      }),
    );
  }

  private async ensureDemoMontants(
    annee: AnneeAcademique,
    levels: Record<'ISE1' | 'ISE2' | 'ISE3' | 'alumni', AcademicLevel>,
  ): Promise<void> {
    const montants = [
      { level: levels.ISE1, montant: 30000 },
      { level: levels.ISE2, montant: 35000 },
      { level: levels.ISE3, montant: 40000 },
    ];

    for (const item of montants) {
      const existing = await this.montantsRepository.findOne({
        where: { anneeAcademique: { id: annee.id }, level: { id: item.level.id }, type: 'niveau' },
      });
      if (!existing) {
        await this.montantsRepository.save(
          this.montantsRepository.create({
            anneeAcademique: annee,
            level: item.level,
            type: 'niveau',
            montant: item.montant,
            dateLimite: '2027-08-31',
            commentaire: 'Montant de demonstration fixe par niveau',
          }),
        );
      }
    }
  }

  private async ensureDemoUser(input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    wavePhone: string;
    role: string;
    accountStatus: string;
    entrySource: string;
    levelId?: string;
    promotionSortante?: string;
  }): Promise<User> {
    const existing = await this.usersService.findByEmail(input.email);
    if (existing) {
      return existing;
    }

    const user = await this.usersService.create(input, input.role);
    if (input.promotionSortante || input.accountStatus === 'alumni') {
      user.promotionSortante = input.promotionSortante;
      user.accountStatus = input.accountStatus;
      return this.usersRepository.save(user);
    }
    return user;
  }

  private async ensureDemoInscription(
    user: User,
    annee: AnneeAcademique,
    level: AcademicLevel,
    eligibleCotisation: boolean,
    statutScolaire: 'actif' | 'alumni',
  ): Promise<void> {
    const existing = await this.inscriptionsRepository.findOne({
      where: { user: { id: user.id }, anneeAcademique: { id: annee.id } },
    });
    if (!existing) {
      await this.inscriptionsRepository.save(
        this.inscriptionsRepository.create({
          user,
          anneeAcademique: annee,
          level,
          statutScolaire,
          eligibleCotisation,
          commentaire: eligibleCotisation ? 'Inscription demo eligible' : 'Alumni demo non eligible',
        }),
      );
    }
  }

  private async ensureDemoCotisation(
    user: User,
    annee: AnneeAcademique,
    amount: number,
    paidAmount: number,
    status: string,
  ): Promise<Cotisation> {
    const existing = await this.cotisationsRepository.findOne({
      where: { user: { id: user.id }, anneeAcademique: { id: annee.id } },
    });
    if (existing) {
      return existing;
    }
    return this.cotisationsRepository.save(
      this.cotisationsRepository.create({
        title: `Cotisation annuelle ${annee.libelle}`,
        description: 'Cotisation DISE generee pour la demonstration CotaDISE',
        amount,
        paidAmount,
        dueDate: '2027-08-31',
        status,
        paid: paidAmount >= amount,
        paidAt: paidAmount >= amount ? new Date('2027-01-15T09:00:00Z') : undefined,
        user,
        anneeAcademique: annee,
        sourceMontant: 'niveau',
      }),
    );
  }

  private async ensureDemoPaiement(
    cotisation: Cotisation,
    user: User,
    payer: User,
    recordedBy: User,
    amount: number,
    reference: string,
    origin: string,
  ): Promise<void> {
    const existing = await this.paiementsRepository.findOne({ where: { reference } });
    if (!existing) {
      await this.paiementsRepository.save(
        this.paiementsRepository.create({
          amount,
          method: 'main_a_main',
          reference,
          status: 'confirme',
          origin,
          payerPhone: payer.wavePhone,
          note: 'Paiement de demonstration saisi par le tresorier',
          appliedAmount: amount,
          appliedAt: new Date('2026-11-20T10:00:00Z'),
          paidAt: new Date('2026-11-20T10:00:00Z'),
          cotisation,
          user,
          payer,
          recordedBy,
        }),
      );
    }
  }

  private async ensureDemoDefi(challenger: User, opponent: User, annee: AnneeAcademique): Promise<void> {
    const existing = await this.defisRepository.findOne({
      where: { challenger: { id: challenger.id }, opponent: { id: opponent.id }, anneeAcademique: { id: annee.id } },
    });
    if (!existing) {
      await this.defisRepository.save(
        this.defisRepository.create({
          challenger,
          opponent,
          anneeAcademique: annee,
          status: 'accepte',
          message: 'Je te defie de solder avant la fin du semestre.',
          acceptedAt: new Date('2026-11-25T12:00:00Z'),
        }),
      );
    }
  }

  private async ensureDemoDon(alumni: User, recordedBy: User): Promise<void> {
    const reference = 'demo-don-alumni-2026-001';
    const existing = await this.donsRepository.findOne({ where: { reference } });
    if (!existing) {
      await this.donsRepository.save(
        this.donsRepository.create({
          alumni,
          recordedBy,
          amount: 75000,
          method: 'main_a_main',
          status: 'confirme',
          origin: 'don_main_a_main',
          reference,
          payerPhone: alumni.wavePhone,
          message: 'Soutien demo de la promotion sortante 2026.',
          donatedAt: new Date('2026-12-05T16:00:00Z'),
        }),
      );
    }
  }
}
