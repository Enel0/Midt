import React, { useEffect, useState } from 'react';

const Denuncias = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [empresaRut, setEmpresaRut] = useState(localStorage.getItem('empresaRut') || '');

  const fetchItems = async () => {
    setLoading(true); setError('');
    try {
      const url = new URL('http://localhost:5000/api/denuncias');
      if (empresaRut) url.searchParams.set('empresaRut', empresaRut);
      const res = await fetch(url);
      if (!res.ok) throw new Error('No se pudo cargar denuncias');
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [empresaRut]);

  const setEstado = async (id, estado) => {
    try {
      const res = await fetch(`http://localhost:5000/api/denuncias/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });
      if (!res.ok) throw new Error('No se pudo actualizar estado');
      fetchItems();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Denuncias</h1>
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          value={empresaRut}
          onChange={(e) => { setEmpresaRut(e.target.value); localStorage.setItem('empresaRut', e.target.value); }}
          placeholder="Filtrar por RUT empresa"
          className="p-2 border rounded"
        />
        <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={fetchItems}>Refrescar</button>
      </div>
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-3 py-2 border-b">Fecha</th>
                <th className="px-3 py-2 border-b">Empresa</th>
                <th className="px-3 py-2 border-b">Trabajador</th>
                <th className="px-3 py-2 border-b">Cargo</th>
                <th className="px-3 py-2 border-b">Motivo</th>
                <th className="px-3 py-2 border-b">Estado</th>
                <th className="px-3 py-2 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b">{new Date(d.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2 border-b">{d.empresaRut}</td>
                  <td className="px-3 py-2 border-b">{d.nombreTrabajador || d.trabajadorRut || '-'}</td>
                  <td className="px-3 py-2 border-b">{d.cargo || '-'}</td>
                  <td className="px-3 py-2 border-b">{d.motivo}</td>
                  <td className="px-3 py-2 border-b">{d.estado}</td>
                  <td className="px-3 py-2 border-b">
                    <div className="flex gap-2">
                      <button className="text-xs bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => setEstado(d._id, 'en_revision')}>En revisión</button>
                      <button className="text-xs bg-green-600 text-white px-2 py-1 rounded" onClick={() => setEstado(d._id, 'resuelta')}>Resuelta</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Denuncias;

