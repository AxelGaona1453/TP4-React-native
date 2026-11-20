export class Pila<T> {
  #items: T[] = [];

  constructor(iniciales: readonly T[] = []) {
    for (const item of iniciales) {
      this.apilar(item);
    }
  }

  apilar(item: T): void {
    this.#items[this.#items.length] = item;
  }

  desapilar(): T | undefined {
    if (this.estaVacia()) {
      return undefined;
    }
    const tope = this.#items[this.#items.length - 1];
    this.#items.length = this.#items.length - 1;
    return tope;
  }

  verTope(): T | undefined {
    return this.#items[this.#items.length - 1];
  }

  estaVacia(): boolean {
    return this.#items.length === 0;
  }

  get tamanio(): number {
    return this.#items.length;
  }

  // De la base al tope.
  aArray(): T[] {
    return [...this.#items];
  }
}
