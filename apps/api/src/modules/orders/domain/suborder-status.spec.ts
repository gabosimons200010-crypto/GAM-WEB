import { allowedTransitions, canTransition, isTerminal } from './suborder-status';

describe('máquina de estados de suborden', () => {
  it('permite el flujo feliz: PAID → PREPARING → SHIPPED → DELIVERED', () => {
    expect(canTransition('PAID', 'PREPARING')).toBe(true);
    expect(canTransition('PREPARING', 'SHIPPED')).toBe(true);
    expect(canTransition('SHIPPED', 'DELIVERED')).toBe(true);
  });

  it('rechaza saltos inválidos', () => {
    expect(canTransition('PAID', 'DELIVERED')).toBe(false);
    expect(canTransition('PAID', 'SHIPPED')).toBe(false);
    expect(canTransition('DELIVERED', 'PREPARING')).toBe(false);
  });

  it('no deja al vendedor tocar PENDING_PAYMENT (lo maneja el pago)', () => {
    expect(allowedTransitions('PENDING_PAYMENT')).toEqual([]);
  });

  it('marca como terminales los estados finales', () => {
    expect(isTerminal('CANCELLED')).toBe(true);
    expect(isTerminal('RETURNED')).toBe(true);
    expect(isTerminal('PAID')).toBe(false);
  });

  it('permite reintentar un envío fallido', () => {
    expect(canTransition('SHIPPED', 'DELIVERY_FAILED')).toBe(true);
    expect(canTransition('DELIVERY_FAILED', 'SHIPPED')).toBe(true);
  });

  it('permite devolución solo desde DELIVERED', () => {
    expect(canTransition('DELIVERED', 'RETURNED')).toBe(true);
    expect(canTransition('SHIPPED', 'RETURNED')).toBe(false);
  });
});
