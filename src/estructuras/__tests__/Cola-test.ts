import { Cola } from '../Cola';

describe('Cola', () => {
  it('empieza vacía', () => {
    const cola = new Cola<string>();
    expect(cola.tamanio).toBe(0);
    expect(cola.estaVacia()).toBe(true);
    expect(cola.aArray()).toEqual([]);
  });

  it('desencolar una cola vacía devuelve undefined y no rompe el tamaño', () => {
    const cola = new Cola<string>();
    expect(cola.desencolar()).toBeUndefined();
    expect(cola.tamanio).toBe(0);
    cola.encolar('Ana');
    expect(cola.tamanio).toBe(1);
  });

  it('respeta el orden FIFO', () => {
    const cola = new Cola<string>(['Ana', 'Beto']);
    cola.encolar('Carla');
    expect(cola.desencolar()).toBe('Ana');
    expect(cola.desencolar()).toBe('Beto');
    expect(cola.desencolar()).toBe('Carla');
    expect(cola.estaVacia()).toBe(true);
  });

  it('verFrente no saca el elemento', () => {
    const cola = new Cola<string>(['Ana', 'Beto']);
    expect(cola.verFrente()).toBe('Ana');
    expect(cola.tamanio).toBe(2);
  });

  it('aArray devuelve una copia del frente al final', () => {
    const cola = new Cola<string>(['Ana', 'Beto', 'Carla']);
    cola.desencolar();
    const copia = cola.aArray();
    expect(copia).toEqual(['Beto', 'Carla']);
    copia.push('Intruso');
    expect(cola.tamanio).toBe(2);
  });

  it('mezclar encolar y desencolar mantiene el tamaño correcto', () => {
    const cola = new Cola<number>();
    for (let i = 0; i < 5; i++) {
      cola.encolar(i);
    }
    cola.desencolar();
    cola.desencolar();
    cola.encolar(99);
    expect(cola.tamanio).toBe(4);
    expect(cola.aArray()).toEqual([2, 3, 4, 99]);
  });
});
