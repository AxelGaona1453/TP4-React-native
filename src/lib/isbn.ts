const TRECE_DIGITOS = /^\d{13}$/;

export function limpiarIsbn(texto: string): string {
  return texto.replace(/[\s-]/g, '');
}

export function esIsbnValido(texto: string | undefined): texto is string {
  return texto !== undefined && TRECE_DIGITOS.test(texto);
}
