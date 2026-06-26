import { SubOrderStatus } from './suborder-status';

export interface OrderItemView {
  variantId: string;
  productName: string;
  size: string | null;
  color: string | null;
  unitPrice: number;
  quantity: number;
}

/** Suborden (de una tienda) dentro de una orden, vista del comprador. */
export interface SubOrderView {
  id: string;
  storeId: string;
  storeName: string;
  status: SubOrderStatus;
  subtotal: number;
  shippingCost: number;
  trackingCode: string | null;
  items: OrderItemView[];
}

/** Orden completa del comprador. */
export interface OrderView {
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

/** Suborden como la ve el vendedor (incluye datos de envío del comprador). */
export interface SellerSubOrderView {
  id: string;
  orderId: string;
  orderNumber: string;
  storeId: string;
  status: SubOrderStatus;
  subtotal: number;
  shippingCost: number;
  commission: number;
  trackingCode: string | null;
  createdAt: Date;
  buyerName: string | null;
  shipTo: {
    department: string;
    province: string;
    district: string;
    line: string;
    reference: string | null;
    phone: string | null;
  } | null;
  items: OrderItemView[];
}

export interface StatusHistoryEntry {
  status: SubOrderStatus;
  note: string | null;
  createdAt: Date;
}
