import React, { useEffect, useMemo, useState } from 'react';

const MisDenuncias = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchItems = async () => {
    setLoading(true); setError('');
    try {
      const url = new URL('http://localhost:5000/api/denuncias/mias/list');
      if (estado) url.searchParams.set('estado', estado);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));
      const token = localStorage.getItem('token');
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('No se pudieron cargar tus denuncias');
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [estado, page, limit]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Mis Denuncias</h1>
      <div className="mb-4 flex items-center gap-2">
        <select value={estado} onChange={(e)=>{ setEstado(e.target.value); setPage(1); }} className="p-2 border rounded">
          <option value="">Todas</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_revision">En revisión</option>
          <option value="resuelta">Resuelta</option>
        </select>
        <select className="p-2 border rounded" value={limit} onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}>
          {[10,20,50].map(n => <option key={n} value={n}>{n}/página</option>)}
        </select>
        <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={()=>{ setPage(1); fetchItems(); }}>Refrescar</button>
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
                <th className="px-3 py-2 border-b">Denunciado</th>
                <th className="px-3 py-2 border-b">Cargo</th>
                <th className="px-3 py-2 border-b">Motivo</th>
                <th className="px-3 py-2 border-b">Estado</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm text-gray-600">{total} resultados</span>
        <button className="px-2 py-1 border rounded" disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>{'<'}</button>
        <span className="text-sm">{page} / {totalPages}</span>
        <button className="px-2 py-1 border rounded" disabled={page>=totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>{'>'}</button>
      </div>
    </div>
  );
};

export default MisDenuncias;

