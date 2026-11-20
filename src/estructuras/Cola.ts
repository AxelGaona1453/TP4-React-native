// Cola FIFO sin shift(): guarda los elementos en un objeto indexado y
// avanza el índice del frente, así desencolar es O(1).
export class Cola<T> {
  #items: Record<number, T> = {};
  #frente = 0;
  #fin = 0;

  constructor(iniciales: readonly T[] = []) {
    for (const item of iniciales) {
      this.encolar(item);
    }
  }

  encolar(item: T): void {
    this.#items[this.#fin] = item;
    this.#fin++;
  }

  desencolar(): T | undefined {
    if (this.estaVacia()) {
      return undefined;
    }
    const item = this.#items[this.#frente];
    delete this.#items[this.#frente];
    this.#frente++;
    return item;
  }

  verFrente(): T | undefined {
    return this.estaVacia() ? undefined : this.#items[this.#frente];
  }

  estaVacia(): boolean {
    return this.tamanio === 0;
  }

  get tamanio(): number {
    return this.#fin - this.#frente;
  }

  // Del frente al final.
  aArray(): T[] {
    const resultado: T[] = [];
    for (let i = this.#frente; i < this.#fin; i++) {
      resultado.push(this.#items[i]);
    }
    return resultado;
  }
}
