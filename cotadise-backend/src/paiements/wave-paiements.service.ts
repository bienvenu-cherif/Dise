import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { WaveMarchandConfigurationsService, WaveRuntimeConfiguration } from '../configurations-wave/wave-marchand-configurations.service';
import { Cotisation } from '../cotisations/cotisation.entity';
import { Paiement } from './paiement.entity';
import { PaiementsService } from './paiements.service';
import { InitiateWavePaiementDto } from './dto/initiate-wave-paiement.dto';
import { WaveWebhookDto } from './dto/wave-webhook.dto';

@Injectable()
export class WavePaiementsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly paiementsService: PaiementsService,
    private readonly waveConfigurationsService: WaveMarchandConfigurationsService,
    @InjectRepository(Cotisation)
    private readonly cotisationsRepository: Repository<Cotisation>,
  ) {}

  async initiate(userId: string, dto: InitiateWavePaiementDto): Promise<{ paiement: Paiement; wave?: unknown; configured: boolean }> {
    const reference = `COTADISE-WAVE-${randomUUID()}`;
    const cotisation = await this.cotisationsRepository.findOne({ where: { id: dto.cotisationId } });
    if (!cotisation) {
      throw new BadRequestException('Cotisation introuvable pour le paiement Wave');
    }
    const runtimeConfig = await this.resolveRuntimeConfiguration(cotisation.anneeAcademique?.id);
    const paiement = await this.paiementsService.create({
      amount: dto.amount,
      method: 'Wave',
      reference,
      cotisationId: dto.cotisationId,
      userId: dto.userId ?? userId,
      payerId: userId,
      status: 'en_attente',
      origin: dto.userId && dto.userId !== userId ? 'paiement_pour_camarade' : 'paiement_personnel',
      payerPhone: dto.payerPhone,
      note: dto.note,
      waveConfigurationId: runtimeConfig?.id !== 'env' ? runtimeConfig?.id : undefined,
    });

    if (!runtimeConfig?.checkoutUrl || !runtimeConfig?.apiKey) {
      return { paiement, configured: false };
    }

    const response = await fetch(runtimeConfig.checkoutUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${runtimeConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: dto.amount,
        currency: runtimeConfig.currency,
        client_reference: reference,
        phone: dto.payerPhone,
        success_url: runtimeConfig.successUrl,
        error_url: runtimeConfig.errorUrl,
        webhook_url: runtimeConfig.webhookUrl,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new BadRequestException({
        message: 'Wave a refuse la demande de paiement',
        wave: payload,
      });
    }

    if (runtimeConfig.id !== 'env') {
      await this.waveConfigurationsService.markTested(runtimeConfig.id, reference);
    }
    return { paiement, wave: payload, configured: true };
  }

  async handleWebhook(payload: WaveWebhookDto | Record<string, unknown>, signature?: string) {
    const webhookPayload = payload as Record<string, unknown>;
    const reference = this.extractReference(webhookPayload);
    if (!reference) {
      throw new BadRequestException('Reference Wave introuvable dans le webhook');
    }
    const paiement = await this.paiementsService.findByReference(reference);
    const runtimeConfig =
      (await this.waveConfigurationsService.getRuntimeById(paiement.waveConfiguration?.id)) ??
      (await this.resolveRuntimeConfiguration(paiement.cotisation?.anneeAcademique?.id));
    this.verifySignature(payload, signature, runtimeConfig?.webhookSecret);

    const status = this.normalizeStatus(String(webhookPayload.status ?? webhookPayload.payment_status ?? ''));
    if (status === 'confirme') {
      return this.paiementsService.confirmByReference(reference, {
        transactionId: String(webhookPayload.transactionId ?? webhookPayload.transaction_id ?? ''),
        raw: webhookPayload,
      });
    }

    if (status === 'echoue' || status === 'annule') {
      return this.paiementsService.markByReference(reference, status, webhookPayload);
    }

    return this.paiementsService.markByReference(reference, 'en_attente', webhookPayload);
  }

  private async resolveRuntimeConfiguration(anneeAcademiqueId?: string): Promise<WaveRuntimeConfiguration | undefined> {
    const runtimeConfig = await this.waveConfigurationsService.getRuntimeForYear(anneeAcademiqueId);
    if (runtimeConfig) {
      return runtimeConfig;
    }
    const checkoutUrl = this.configService.get<string>('WAVE_CHECKOUT_URL');
    const apiKey = this.configService.get<string>('WAVE_API_KEY');
    if (!checkoutUrl || !apiKey) {
      return undefined;
    }
    return {
      id: 'env',
      nomCompte: 'Configuration .env',
      checkoutUrl,
      apiKey,
      currency: this.configService.get<string>('WAVE_CURRENCY', 'XOF'),
      successUrl: this.configService.get<string>('WAVE_SUCCESS_URL'),
      errorUrl: this.configService.get<string>('WAVE_ERROR_URL'),
      webhookUrl: this.configService.get<string>('WAVE_WEBHOOK_URL'),
      webhookSecret: this.configService.get<string>('WAVE_WEBHOOK_SECRET'),
    };
  }

  private verifySignature(payload: unknown, signature?: string, configuredSecret?: string) {
    const secret = configuredSecret ?? this.configService.get<string>('WAVE_WEBHOOK_SECRET');
    if (!secret) {
      return;
    }
    if (!signature) {
      throw new UnauthorizedException('Signature Wave manquante');
    }

    const expected = createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    const received = signature.replace(/^sha256=/, '');
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
      throw new UnauthorizedException('Signature Wave invalide');
    }
  }

  private extractReference(payload: Record<string, unknown>) {
    return String(
      payload.reference ??
        payload.client_reference ??
        payload.merchant_reference ??
        (payload.data as any)?.reference ??
        (payload.data as any)?.client_reference ??
        '',
    );
  }

  private normalizeStatus(status: string) {
    const normalized = status.toLowerCase();
    if (['success', 'succeeded', 'completed', 'complete', 'confirme', 'confirmed'].includes(normalized)) {
      return 'confirme';
    }
    if (['failed', 'failure', 'echoue', 'cancelled', 'canceled'].includes(normalized)) {
      return normalized.includes('cancel') ? 'annule' : 'echoue';
    }
    return 'en_attente';
  }
}
