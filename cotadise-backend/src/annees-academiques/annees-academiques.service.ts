import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cotisation } from '../cotisations/cotisation.entity';
import { InscriptionAnnuelle } from '../inscriptions-annuelles/inscription-annuelle.entity';
import { MontantCotisation } from '../montants-cotisation/montant-cotisation.entity';
import { WaveMarchandConfiguration } from '../configurations-wave/wave-marchand-configuration.entity';
import { AnneeAcademique } from './annee-academique.entity';
import { CreateAnneeAcademiqueDto } from './dto/create-annee-academique.dto';
import { UpdateAnneeAcademiqueDto } from './dto/update-annee-academique.dto';

@Injectable()
export class AnneesAcademiquesService {
  constructor(
    @InjectRepository(AnneeAcademique)
    private readonly anneesRepository: Repository<AnneeAcademique>,
    @InjectRepository(InscriptionAnnuelle)
    private readonly inscriptionsRepository: Repository<InscriptionAnnuelle>,
    @InjectRepository(MontantCotisation)
    private readonly montantsRepository: Repository<MontantCotisation>,
    @InjectRepository(Cotisation)
    private readonly cotisationsRepository: Repository<Cotisation>,
    @InjectRepository(WaveMarchandConfiguration)
    private readonly waveConfigurationsRepository: Repository<WaveMarchandConfiguration>,
  ) {}

  create(dto: CreateAnneeAcademiqueDto): Promise<AnneeAcademique> {
    return this.anneesRepository.save(this.anneesRepository.create(dto));
  }

  findAll(): Promise<AnneeAcademique[]> {
    return this.anneesRepository.find({ order: { dateDebut: 'DESC' } });
  }

  async findActive(): Promise<AnneeAcademique> {
    const annee = await this.anneesRepository.findOne({ where: { active: true } });
    if (!annee) {
      throw new NotFoundException('Aucune annee academique active');
    }
    return annee;
  }

  async findOne(id: string): Promise<AnneeAcademique> {
    const annee = await this.anneesRepository.findOne({ where: { id } });
    if (!annee) {
      throw new NotFoundException(`Annee academique avec id ${id} introuvable`);
    }
    return annee;
  }

  async update(id: string, dto: UpdateAnneeAcademiqueDto): Promise<AnneeAcademique> {
    const annee = await this.findOne(id);
    Object.assign(annee, dto);
    return this.anneesRepository.save(annee);
  }

  async ouvrir(id: string): Promise<AnneeAcademique> {
    const annee = await this.findOne(id);
    await this.anneesRepository.update({ active: true }, { active: false });
    annee.active = true;
    annee.statut = 'ouverte';
    return this.anneesRepository.save(annee);
  }

  async fermer(id: string): Promise<AnneeAcademique> {
    const annee = await this.findOne(id);
    annee.active = false;
    annee.statut = 'fermee';
    return this.anneesRepository.save(annee);
  }

  async getPreparation(id: string) {
    const annee = await this.findOne(id);
    const [inscriptions, montants, cotisationsCount, waveActive] = await Promise.all([
      this.inscriptionsRepository.find({ where: { anneeAcademique: { id } } }),
      this.montantsRepository.find({ where: { anneeAcademique: { id } } }),
      this.cotisationsRepository.count({ where: { anneeAcademique: { id } } }),
      this.waveConfigurationsRepository.findOne({ where: { anneeAcademique: { id }, active: true, statut: 'validee' } }),
    ]);

    const eligibleInscriptions = inscriptions.filter((item) => this.isEligibleInscription(item));
    const levelIdsWithEligibleStudents = new Set(eligibleInscriptions.map((item) => item.level?.id).filter(Boolean));
    const levelIdsWithAmount = new Set(montants.filter((item) => item.type === 'niveau' && item.level?.id).map((item) => item.level!.id));
    const missingLevelAmounts = [...levelIdsWithEligibleStudents]
      .filter((levelId) => !levelIdsWithAmount.has(levelId))
      .map((levelId) => {
        const inscription = eligibleInscriptions.find((item) => item.level?.id === levelId);
        return {
          levelId,
          levelName: inscription?.level?.name ?? 'Niveau inconnu',
        };
      });

    const checks = [
      {
        key: 'annee_active',
        label: 'Annee ouverte et active',
        ok: annee.active && annee.statut === 'ouverte',
        details: `${annee.libelle} est ${annee.statut}${annee.active ? ' et active' : ''}`,
      },
      {
        key: 'inscriptions',
        label: 'Etudiants eligibles inscrits',
        ok: eligibleInscriptions.length > 0,
        details: `${eligibleInscriptions.length} etudiant(s) eligible(s)`,
      },
      {
        key: 'montants',
        label: 'Montants definis par niveau',
        ok: missingLevelAmounts.length === 0 && levelIdsWithAmount.size > 0,
        details:
          missingLevelAmounts.length === 0
            ? `${levelIdsWithAmount.size} niveau(x) couvert(s)`
            : `Montants manquants: ${missingLevelAmounts.map((item) => item.levelName).join(', ')}`,
      },
      {
        key: 'cotisations',
        label: 'Cotisations generees',
        ok: cotisationsCount > 0,
        details: `${cotisationsCount} cotisation(s) annuelle(s)`,
      },
      {
        key: 'wave',
        label: 'Compte Wave marchand actif',
        ok: Boolean(waveActive),
        details: waveActive ? `${waveActive.nomCompte} actif` : 'Aucun compte Wave valide actif pour cette annee',
      },
    ];

    return {
      anneeAcademique: {
        id: annee.id,
        libelle: annee.libelle,
        statut: annee.statut,
        active: annee.active,
      },
      pretPaiements: checks.every((check) => check.ok),
      score: checks.filter((check) => check.ok).length,
      total: checks.length,
      counts: {
        inscriptions: inscriptions.length,
        eligibleInscriptions: eligibleInscriptions.length,
        montants: montants.length,
        cotisations: cotisationsCount,
      },
      missingLevelAmounts,
      checks,
    };
  }

  private isEligibleInscription(inscription: InscriptionAnnuelle): boolean {
    if (!inscription.eligibleCotisation) {
      return false;
    }
    if (['abandon', 'exclu', 'alumni'].includes(inscription.statutScolaire)) {
      return false;
    }
    return inscription.level?.name?.toLowerCase() !== 'alumni';
  }
}
