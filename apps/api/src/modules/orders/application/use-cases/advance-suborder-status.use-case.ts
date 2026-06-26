import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderQueryRepository } from '../ports/order-query.repository';
import { StoreRepository } from '../../../seller/application/ports/store.repository';
import { SellerSubOrderView } from '../../domain/order-view';
import { SubOrderStatus, allowedTransitions, canTransition } from '../../domain/suborder-status';

export interface AdvanceStatusInput {
  userId: string;
  subOrderId: string;
  to: SubOrderStatus;
  note?: string | null;
  trackingCode?: string | null;
}

/**
 * El vendedor avanza el estado de una suborden suya (RF-MKT-007), validando la
 * propiedad de la tienda y que la transición sea legal según la máquina de
 * estados. Registra el historial.
 */
@Injectable()
export class AdvanceSubOrderStatusUseCase {
  constructor(
    private readonly orders: OrderQueryRepository,
    private readonly stores: StoreRepository,
  ) {}

  async execute(input: AdvanceStatusInput): Promise<SellerSubOrderView> {
    const ref = await this.orders.getSubOrderRef(input.subOrderId);
    if (!ref) {
      throw new NotFoundException('Suborden no encontrada');
    }
    if (!(await this.stores.userOwnsStore(input.userId, ref.storeId))) {
      throw new ForbiddenException('No administras esta tienda');
    }
    if (!canTransition(ref.status, input.to)) {
      const opts = allowedTransitions(ref.status);
      throw new BadRequestException(
        `No se puede pasar de ${ref.status} a ${input.to}.` +
          (opts.length ? ` Transiciones válidas: ${opts.join(', ')}.` : ' La suborden está en un estado final.'),
      );
    }
    return this.orders.advanceStatus(input.subOrderId, input.to, input.userId, input.note ?? null, input.trackingCode ?? null);
  }
}
