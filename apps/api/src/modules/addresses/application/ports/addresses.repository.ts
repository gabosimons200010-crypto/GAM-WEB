export interface AddressView {
  id: string;
  department: string;
  province: string;
  district: string;
  line: string;
  reference: string | null;
  phone: string | null;
  isDefault: boolean;
}

export interface CreateAddressData {
  department: string;
  province: string;
  district: string;
  line: string;
  reference?: string | null;
  phone?: string | null;
  isDefault?: boolean;
}

/** Libreta de direcciones del comprador. Cada quien ve/gestiona solo las suyas. */
export abstract class AddressesRepository {
  abstract listForUser(userId: string): Promise<AddressView[]>;
  abstract create(userId: string, data: CreateAddressData): Promise<AddressView>;
  /** Borra una dirección del usuario (no-op si no es suya). */
  abstract remove(userId: string, addressId: string): Promise<void>;
  /** Marca una como predeterminada (desmarca las demás). null si no es suya. */
  abstract setDefault(userId: string, addressId: string): Promise<AddressView | null>;
}
