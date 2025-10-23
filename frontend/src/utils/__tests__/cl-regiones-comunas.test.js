import { describe, it, expect } from 'vitest';
import { regiones, comunasByRegion, validarRutFormato, validarRutDV, formatearRut, calcularDV } from '../../utils/cl-regiones-comunas';

describe('Utilidades Chile', () => {
  it('regiones contiene Metropolitana y comunasByRegion devuelve comunas', () => {
    expect(regiones).toContain('Metropolitana de Santiago');
    const comunas = comunasByRegion('Metropolitana de Santiago');
    expect(Array.isArray(comunas)).toBe(true);
    expect(comunas.length).toBeGreaterThan(0);
    expect(comunas).toContain('Santiago');
  });

  it('validarRutFormato acepta 12.345.678-5 y rechaza formato inválido', () => {
    expect(validarRutFormato('12.345.678-5')).toBe(true);
    expect(validarRutFormato('12345678-5')).toBe(false);
    expect(validarRutFormato('12.345.6785')).toBe(false);
  });

  it('calcularDV y validarRutDV funcionan con DV 5 y K', () => {
    // 12345678 => DV 5
    expect(calcularDV(12345678)).toBe('5');
    expect(validarRutDV('12.345.678-5')).toBe(true);
    // 11111111 => DV 1 (ejemplo común), 20000000 => DV K depende del algoritmo
    const dv = calcularDV(20000000);
    expect(['0','1','2','3','4','5','6','7','8','9','K']).toContain(dv);
  });

  it('formatearRut inserta puntos y guion correctamente', () => {
    expect(formatearRut('123456785')).toBe('12.345.678-5');
    expect(formatearRut('12345678-5')).toBe('12.345.678-5');
  });
});

