import { OrderDraft } from '../../domain/order';

export interface ShippingAddress {
  department: string;
  province: string;
  district: string;
  line: string;
  reference?: string | null;
  phone?: string | null;
}

export interface BuyerInfo {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  dni?: string | null;
}

export interface PlaceOrderData {
  userId: string;
  buyer: BuyerInfo;
  address: ShippingAddress;
  draft: OrderDraft;
  reservationExpiresAt: Date;
}

export interface OrderItemView {
  variantId: string;
  productName: string;
  size: string | null;
  color: string | null;
  unitPrice: number;
  quantity: number;
}

export interface SubOrderView {
  id: string;
  storeId: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  commission: number;
  items: OrderItemView[];
}

export interface OrderSummaryView {
  id: string;
  number: string;
  status: string;
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  createdAt: Date;
  subOrders: SubOrderView[];
}

export abstract class OrderRepository {
  /**
   * Crea la orden, sus subórdenes e ítems y reserva el stock de cada variante,
   * todo en una sola transacción. Si alguna variante ya no tiene stock
   * suficiente (sobreventa por concurrencia), revierte todo y lanza conflicto.
   */
  abstract placeOrder(data: PlaceOrderData): Promise<OrderSummaryView>;
}
