import { Injectable, Logger } from '@nestjs/common';
import { CodeDelivery } from '../application/ports/code-delivery';

/**
 * Entrega de códigos por log (MVP). En sprints siguientes se reemplaza por un
 * adaptador que encola en Notifications (email/WhatsApp/SMS) vía BullMQ, sin
 * tocar los casos de uso (gracias al puerto CodeDelivery).
 */
@Injectable()
export class LogCodeDelivery extends CodeDelivery {
  private readonly logger = new Logger('CodeDelivery');

  async sendEmailConfirmation(email: string, token: string): Promise<void> {
    this.logger.log(`[email-confirm] ${email} → token=${token}`);
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    this.logger.log(`[password-reset] ${email} → token=${token}`);
  }

  async sendPhoneOtp(phone: string, code: string): Promise<void> {
    this.logger.log(`[phone-otp] ${phone} → code=${code}`);
  }
}
