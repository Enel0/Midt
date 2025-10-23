import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Denunciar from '../estructura/Denunciar.jsx';
import { MemoryRouter } from 'react-router-dom';
import { UserContext } from '../context/UserContext.jsx';

const renderWithProviders = (ui, { route = '/denunciar?empresaRut=76.543.210-9' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <UserContext.Provider value={{ user: { nombre: 'Test', email: 'test@acme.com' } }}>
        {ui}
      </UserContext.Provider>
    </MemoryRouter>
  );
};

describe('Denunciar', () => {
  const origFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn(async (url, init) => {
      expect(url).toMatch(/\/api\/denuncias$/);
      expect(init.method).toBe('POST');
      expect(init.headers?.Authorization).toBe('Bearer token-prueba');
      expect(init.body).toBeInstanceOf(FormData);
      const entries = Array.from(init.body.entries()).map(([k, v]) => [k, v instanceof File ? `file:${v.name}` : v]);
      const keys = entries.map(([k]) => k);
      expect(keys).toEqual(expect.arrayContaining([
        'empresaRut','motivo','detalle','declaraVeracidad','autorizaDatosPersonales'
      ]));
      return { ok: true, status: 201, json: async () => ({ _id: 'abc123' }) };
    });
    window.localStorage.setItem('token', 'token-prueba');
  });

  afterEach(() => {
    global.fetch = origFetch;
    window.localStorage.clear();
  });

  it('envía FormData con campos requeridos', async () => {
    renderWithProviders(<Denunciar />);

    // Seleccionar un tipo (checkbox)
    const tipoAcoso = screen.getByLabelText('Acoso laboral');
    fireEvent.click(tipoAcoso);

    // Ingresar descripción detallada
    const descripcion = screen.getByLabelText(/Descripción detallada/i);
    fireEvent.change(descripcion, { target: { value: 'Detalle de prueba' } });

    // Consentimientos
    fireEvent.click(screen.getByLabelText(/verídica y fue realizada de buena fe/i));
    fireEvent.click(screen.getByLabelText(/tratamiento de mis datos personales/i));

    // Enviar formulario
    const submit = screen.getByRole('button', { name: /Enviar Denuncia/i });
    fireEvent.click(submit);

    // Espera a que el mock de fetch sea llamado
    await screen.findByText(/Formulario de Denuncia/i);
    expect(global.fetch).toHaveBeenCalledOnce();
  });
});
