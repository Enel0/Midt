import React, { useEffect, useMemo, useState } from 'react';

const Denuncias = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [empresaRut, setEmpresaRut] = useState(localStorage.getItem('empresaRut') || '');
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState({});
  const [detail, setDetail] = useState(null);

  const fetchItems = async () => {
    setLoading(true); setError('');
    try {
      const url = new URL('http://localhost:5000/api/denuncias');
      if (empresaRut) url.searchParams.set('empresaRut', empresaRut);
      if (q) url.searchParams.set('q', q);
      if (estado) url.searchParams.set('estado', estado);
      if (startDate) url.searchParams.set('startDate', startDate);
      if (endDate) url.searchParams.set('endDate', endDate);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));
      const res = await fetch(url);
      if (!res.ok) throw new Error('No se pudo cargar denuncias');
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [empresaRut, q, estado, startDate, endDate, page, limit]);

  const actualizarEstadoDenuncia = async (id, estado) => {
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

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);
  const toggleSelect = (id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  const bulkSelectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);
  const bulkSetEstado = async (nuevo) => {
    if (!bulkSelectedIds.length) return;
    const ok = window.confirm(`Actualizar estado a "${nuevo}" de ${bulkSelectedIds.length} denuncias?`);
    if (!ok) return;
    for (const id of bulkSelectedIds) {
      try { await fetch(`http://localhost:5000/api/denuncias/${id}/estado`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: nuevo }) }); } catch {}
    }
    setSelected({});
    fetchItems();
  };

  const verDetalle = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/denuncias/${id}`);
      if (!res.ok) throw new Error('No se pudo obtener la denuncia');
      const data = await res.json();
      setDetail(data);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Denuncias</h1>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-2">
        <input type="text" value={empresaRut} onChange={(e) => { setEmpresaRut(e.target.value); localStorage.setItem('empresaRut', e.target.value); }} placeholder="RUT empresa" className="p-2 border rounded" />
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar (rut/nombre/cargo/motivo)" className="p-2 border rounded" />
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="p-2 border rounded">
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_revision">En revisión</option>
          <option value="resuelta">Resuelta</option>
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border rounded" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border rounded" />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={() => { setPage(1); fetchItems(); }}>Aplicar filtros</button>
          <select className="p-2 border rounded" value={limit} onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}>
            {[10,20,50].map(n => <option key={n} value={n}>{n}/página</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{total} resultados</span>
          <button className="px-2 py-1 border rounded" disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>{'<'}</button>
          <span className="text-sm">{page} / {totalPages}</span>
          <button className="px-2 py-1 border rounded" disabled={page>=totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>{'>'}</button>
        </div>
      </div>
      {bulkSelectedIds.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm">Seleccionados: {bulkSelectedIds.length}</span>
          <button className="text-xs bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => bulkSetEstado('en_revision')}>Marcar en revisión</button>
          <button className="text-xs bg-green-600 text-white px-2 py-1 rounded" onClick={() => bulkSetEstado('resuelta')}>Marcar resueltas</button>
        </div>
      )}
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-3 py-2 border-b"><input type="checkbox" onChange={(e)=>{
                  const checked = e.target.checked; const map = {}; items.forEach(d=>map[d._id]=checked); setSelected(map);
                }} /></th>
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
                  <td className="px-3 py-2 border-b"><input type="checkbox" checked={!!selected[d._id]} onChange={()=>toggleSelect(d._id)} /></td>
                  <td className="px-3 py-2 border-b">{new Date(d.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2 border-b">{d.empresaRut}</td>
                  <td className="px-3 py-2 border-b">{d.nombreTrabajador || d.trabajadorRut || '-'}</td>
                  <td className="px-3 py-2 border-b">{d.cargo || '-'}</td>
                  <td className="px-3 py-2 border-b">{d.motivo}</td>
                  <td className="px-3 py-2 border-b">
                    <select value={d.estado} onChange={(e)=>actualizarEstadoDenuncia(d._id, e.target.value)} className="text-sm border rounded p-1">
                      <option value="pendiente">pendiente</option>
                      <option value="en_revision">en revisión</option>
                      <option value="resuelta">resuelta</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 border-b">
                    <div className="flex gap-2">
                      <button className="text-xs px-2 py-1 rounded border" onClick={()=>verDetalle(d._id)}>Ver</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center" onClick={()=>setDetail(null)}>
          <div className="bg-white rounded shadow p-4 max-w-lg w-full" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Detalle de denuncia</h2>
              <button onClick={()=>setDetail(null)}>✕</button>
            </div>
            <div className="space-y-1 text-sm">
              <div><span className="font-semibold">Fecha:</span> {new Date(detail.createdAt).toLocaleString()}</div>
              <div><span className="font-semibold">Empresa:</span> {detail.empresaRut}</div>
              <div><span className="font-semibold">Trabajador:</span> {detail.nombreTrabajador || detail.trabajadorRut || '-'}</div>
              <div><span className="font-semibold">Cargo:</span> {detail.cargo || '-'}</div>
              <div><span className="font-semibold">Motivo:</span> {detail.motivo}</div>
              <div><span className="font-semibold">Detalle:</span> {detail.detalle || '-'}</div>
              <div><span className="font-semibold">Estado:</span> {detail.estado}</div>
            </div>
            <div className="mt-3 flex justify-end">
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded" onClick={()=>setDetail(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Denuncias;
