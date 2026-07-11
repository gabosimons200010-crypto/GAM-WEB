// Identidad editorial "Emporio" (espejo de apps/web): papel blanco, tinta
// negra, líneas finas grises, rojo solo para descuentos, mayúsculas espaciadas.

export const colors = {
  paper: '#ffffff',
  ink: '#111111',
  muted: '#767676',
  line: '#e5e5e5',
  lineStrong: '#111111',
  sale: '#c8102e',
  surface: '#f4f4f4',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 40,
} as const;

/** Estilo de etiqueta "microcaps": 11px, mayúsculas, tracking amplio. */
export const microcaps = {
  fontSize: 11,
  letterSpacing: 1.4,
  textTransform: 'uppercase',
  color: colors.ink,
} as const;
