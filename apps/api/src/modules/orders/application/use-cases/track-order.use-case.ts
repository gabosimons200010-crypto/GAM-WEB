import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderQueryRepository } from '../ports/order-query.repository';
import { OrderView } from '../../domain/order-view';

/**
 * Rastreo público de un pedido por número + correo. Permite al invitado (o a
 * cualquiera con esos datos) volver a consultar el estado sin iniciar sesión.
 */
@Injectable()
export class TrackOrderUseCase {
  constructor(private readonly orders: OrderQueryRepository) {}

  async execute(number: string, email: string): Promise<OrderView> {
    const order = await this.orders.findByNumberAndEmail(number.trim(), email.trim());
    if (!order) {
      throw new NotFoundException('No encontramos un pedido con ese número y correo.');
    }
    return order;
  }
}
