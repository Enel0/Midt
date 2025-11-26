import React, { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return null;
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const size = bytes / 1024 ** index;
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[index]}`;
};

const buildEvidenceUrl = (evidence) => {
  if (!evidence) return null;
  let raw = evidence.path || (evidence.filename ? `uploads/denuncias/${evidence.filename}` : '');
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  raw = raw.replace(/\\/g, '/');
  const uploadsIdx = raw.toLowerCase().lastIndexOf('/uploads/');
  if (uploadsIdx !== -1) {
    raw = raw.slice(uploadsIdx + 1); // remove leading slash to keep relative path
  }
  raw = raw.replace(/^\.?\/+/, '');
  if (!raw.startsWith('uploads/')) raw = `uploads/${raw}`;
  return `${API_BASE_URL}/${raw}`;
};

const isImageMime = (mime) => typeof mime === 'string' && mime.startsWith('image/');

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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-40" onClick={()=>setDetail(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Detalle de denuncia</p>
                <h2 className="text-xl font-semibold text-gray-900">#{detail._id?.slice(-6) || ''}</h2>
              </div>
              <button className="text-gray-500 hover:text-gray-700 text-xl leading-none" onClick={()=>setDetail(null)} aria-label="Cerrar modal">×</button>
            </div>
            <div className="px-5 py-4 space-y-6 text-sm text-gray-800">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-gray-500">Fecha de creación</p>
                  <p className="font-medium">{new Date(detail.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Estado</p>
                  <p className="font-semibold capitalize">{detail.estado || 'pendiente'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Empresa</p>
                  <p className="font-medium">{detail.empresaRut || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Nodo / cargo</p>
                  <p className="font-medium">{detail.cargo || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Trabajador denunciado</p>
                  <p className="font-medium">{detail.nombreTrabajador || detail.trabajadorRut || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">RUT denunciado</p>
                  <p className="font-medium">{detail.trabajadorRut || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase text-gray-500 mb-1">Motivo declarado</p>
                <p className="text-gray-900">{detail.motivo || '-'}</p>
              </div>
              {Array.isArray(detail.tipos) && detail.tipos.length > 0 && (
                <div>
                  <p className="text-xs uppercase text-gray-500 mb-2">Tipos marcados</p>
                  <div className="flex flex-wrap gap-2">
                    {detail.tipos.filter(Boolean).map((tipo) => (
                      <span key={tipo} className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs">{tipo}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-gray-500">Fecha o período de hechos</p>
                  <p className="font-medium">{detail.fechaOPeriodo || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Lugar de los hechos</p>
                  <p className="font-medium">{detail.lugarHechos || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase text-gray-500 mb-1">Descripción detallada</p>
                <p className="whitespace-pre-line bg-gray-50 border border-gray-200 rounded p-3">{detail.detalle || 'Sin descripción'}</p>
              </div>

              {(detail.evidenciaDescripcion || (detail.evidencias?.length ?? 0) > 0) && (
                <div className="space-y-3">
                  {detail.evidenciaDescripcion && (
                    <div>
                      <p className="text-xs uppercase text-gray-500 mb-1">Descripción de la evidencia</p>
                      <p className="bg-gray-50 border border-gray-200 rounded p-3 whitespace-pre-line">{detail.evidenciaDescripcion}</p>
                    </div>
                  )}
                  {Array.isArray(detail.evidencias) && detail.evidencias.length > 0 && (
                    <div>
                      <p className="text-xs uppercase text-gray-500 mb-2">Archivos adjuntos</p>
                      <div className="space-y-2">
                        {detail.evidencias.map((ev, idx) => {
                          const url = buildEvidenceUrl(ev);
                          return (
                            <div key={`${ev.filename || idx}-${idx}`} className="border rounded-lg p-3 bg-white shadow-sm">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-medium text-gray-900">{ev.originalname || ev.filename || `Archivo ${idx + 1}`}</p>
                                  <p className="text-xs text-gray-500">{ev.mimetype || 'Formato desconocido'}{ev.size ? ` · ${formatBytes(ev.size)}` : ''}</p>
                                </div>
                                {url && (
                                  <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-medium underline">
                                    Ver / descargar
                                  </a>
                                )}
                              </div>
                              {url && isImageMime(ev.mimetype) && (
                                <div className="mt-2">
                                  <img src={url} alt={ev.originalname || 'Evidencia'} className="max-h-64 rounded border object-contain w-full bg-gray-50" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(detail.testigoNombre || detail.testigoCargoRelacion || detail.testigoContacto) && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Testigo</p>
                    <p className="font-medium">{detail.testigoNombre || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Cargo / relación</p>
                    <p className="font-medium">{detail.testigoCargoRelacion || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Contacto</p>
                    <p className="font-medium break-words">{detail.testigoContacto || '-'}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${detail.declaraVeracidad ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                  {detail.declaraVeracidad ? 'Declaró veracidad de los hechos' : 'Sin declaración de veracidad'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${detail.autorizaDatosPersonales ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                  {detail.autorizaDatosPersonales ? 'Autorizó tratamiento de datos' : 'No autorizó tratamiento de datos'}
                </span>
              </div>
            </div>
            <div className="px-5 py-4 border-t flex justify-end">
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded" onClick={()=>setDetail(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Denuncias;
