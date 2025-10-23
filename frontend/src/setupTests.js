import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Stub comunes del entorno de pruebas
if (typeof window !== 'undefined') {
  // Evitar errores por usos de alert en componentes
  if (!window.alert) {
    // eslint-disable-next-line no-console
    window.alert = vi.fn();
  }
}
