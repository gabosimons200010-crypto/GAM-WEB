/**
 * Puerto de entrega de códigos/enlaces (email confirmación, OTP SMS, reset).
 * En el MVP la implementación registra en log; en sprints siguientes se conecta
 * a la cola de Notifications (email/WhatsApp/SMS) vía BullMQ.
 */
export abstract class CodeDelivery {
  abstract sendEmailConfirmation(email: string, token: string): Promise<void>;
  abstract sendPasswordReset(email: string, token: string): Promise<void>;
  abstract sendPhoneOtp(phone: string, code: string): Promise<void>;
}
