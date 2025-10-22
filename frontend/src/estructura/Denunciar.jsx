import React, { useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
}

const Denunciar = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const q = useQuery();

  const empresaRut = q.empresaRut || '';
  const nodoId = q.nodoId || '';
  const trabajadorRut = q.trabajadorRut || '';
  const nombreTrabajador = q.nombreTrabajador || '';
  const cargo = q.cargo || '';

  const [motivo, setMotivo] = useState('');
  const [detalle, setDetalle] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!empresaRut || !motivo) { setError('Empresa y motivo son obligatorios'); return; }
    try {
      setSending(true);
      const body = { empresaRut, motivo, detalle };
      if (nodoId) Object.assign(body, { nodoId, trabajadorRut, nombreTrabajador, cargo });
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('http://localhost:5000/api/denuncias', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('No se pudo enviar la denuncia');
      navigate('/organigrama');
      alert('Denuncia enviada');
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Formulario de Denuncia</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-semibold mb-1">Demandante</h3>
            <div className="text-sm text-gray-700">{user ? `${user.nombre || ''} (${user.email || ''})` : 'No autenticado'}</div>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Denunciado</h3>
            <div className="text-sm text-gray-700">{nombreTrabajador || trabajadorRut || '-'}</div>
            {cargo && <div className="text-xs text-gray-500">Cargo: {cargo}</div>}
          </div>
          <div>
            <h3 className="font-semibold mb-1">Empresa</h3>
            <div className="text-sm text-gray-700">{empresaRut || '-'}</div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Motivo</label>
            <input className="w-full border rounded p-2" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Describe brevemente el motivo" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Detalle (opcional)</label>
            <textarea className="w-full border rounded p-2 h-32" value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Agrega más información" />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={sending} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded">
              {sending ? 'Enviando...' : 'Enviar Denuncia'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded border">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Denunciar;
