import { Pila } from '../Pila';

describe('Pila', () => {
  it('empieza vacía y desapilar devuelve undefined', () => {
    const pila = new Pila<string>();
    expect(pila.tamanio).toBe(0);
    expect(pila.estaVacia()).toBe(true);
    expect(pila.desapilar()).toBeUndefined();
    expect(pila.verTope()).toBeUndefined();
  });

  it('respeta el orden LIFO', () => {
    const pila = new Pila<string>();
    pila.apilar('a');
    pila.apilar('b');
    pila.apilar('c');
    expect(pila.desapilar()).toBe('c');
    expect(pila.desapilar()).toBe('b');
    expect(pila.tamanio).toBe(1);
  });

  it('verTope no saca el elemento', () => {
    const pila = new Pila<string>(['a', 'b']);
    expect(pila.verTope()).toBe('b');
    expect(pila.tamanio).toBe(2);
  });

  it('aArray devuelve una copia de la base al tope', () => {
    const pila = new Pila<string>(['a', 'b']);
    const copia = pila.aArray();
    expect(copia).toEqual(['a', 'b']);
    copia.push('c');
    expect(pila.tamanio).toBe(2);
  });
});
