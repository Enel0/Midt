import React, { useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, buildApiUrl } from '../utils/api';
import { UserContext } from '../context/UserContext';
import { regiones, comunasByRegion } from '../utils/cl-regiones-comunas';

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
    raw = raw.slice(uploadsIdx + 1);
  }
  raw = raw.replace(/^\.?\/+/, '');
  if (!raw.startsWith('uploads/')) raw = `uploads/${raw}`;
  return `${API_BASE_URL}/${raw}`;
};

const isImageMime = (mime) => typeof mime === 'string' && mime.startsWith('image/');

const Denuncias = () => {
  const { darkMode } = useContext(UserContext);
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
  const [regionFiltro, setRegionFiltro] = useState('');
  const [comunaFiltro, setComunaFiltro] = useState('');
  const comunasFiltro = useMemo(() => comunasByRegion(regionFiltro), [regionFiltro]);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const url = new URL(buildApiUrl('/api/denuncias'));
      if (empresaRut) url.searchParams.set('empresaRut', empresaRut);
      if (q) url.searchParams.set('q', q);
      if (estado) url.searchParams.set('estado', estado);
      if (startDate) url.searchParams.set('startDate', startDate);
      if (endDate) url.searchParams.set('endDate', endDate);
      if (regionFiltro) url.searchParams.set('regionHechos', regionFiltro);
      if (comunaFiltro) url.searchParams.set('comunaHechos', comunaFiltro);
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

  useEffect(() => { fetchItems(); }, [empresaRut, q, estado, startDate, endDate, regionFiltro, comunaFiltro, page, limit]);

  const actualizarEstadoDenuncia = async (id, estadoNuevo) => {
    try {
      const res = await fetch(buildApiUrl(`/api/denuncias/${id}/estado`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: estadoNuevo })
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
      try {
        await fetch(buildApiUrl(`/api/denuncias/${id}/estado`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: nuevo })
        });
      } catch {}
    }
    setSelected({});
    fetchItems();
  };

  const verDetalle = async (id) => {
    try {
      const res = await fetch(buildApiUrl(`/api/denuncias/${id}`));
      if (!res.ok) throw new Error('No se pudo obtener la denuncia');
      const data = await res.json();
      setDetail(data);
    } catch (e) {
      alert(e.message);
    }
  };

  const containerClasses = darkMode
    ? "min-h-screen bg-[#050b1b] text-white p-6 transition-colors"
    : "min-h-screen bg-gray-50 text-[#0D0A4F] p-6 transition-colors";
  const inputClasses = darkMode
    ? "p-2 border border-white/20 rounded bg-white/5 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#FF540C]"
    : "p-2 border border-gray-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF540C]";
  const panelClasses = darkMode
    ? "bg-[#0f162f]/95 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 p-4"
    : "bg-white border border-gray-200 rounded-2xl shadow p-4";
  const buttonSecondary = darkMode
    ? "px-2 py-1 border border-white/30 rounded text-white disabled:opacity-40"
    : "px-2 py-1 border border-gray-300 rounded text-gray-700 disabled:opacity-40";
  const textMuted = darkMode ? "text-sm text-white/70" : "text-sm text-gray-600";
  const tableClasses = darkMode
    ? "min-w-full bg-[#0b1224]/95 border border-white/10 rounded text-white"
    : "min-w-full bg-white border border-gray-200 rounded text-gray-800";
  const headRowClasses = darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-left";
  const cellBorder = darkMode ? "border-white/10" : "border-gray-200";
  const rowHover = darkMode ? "hover:bg-white/5" : "hover:bg-gray-50";
  const modalBg = darkMode ? "bg-[#0f162f] text-white border border-white/10" : "bg-white text-gray-800";
  const modalMuted = darkMode ? "text-xs uppercase text-white/60" : "text-xs uppercase text-gray-500";
  const modalSurface = darkMode
    ? "whitespace-pre-line bg-white/5 border border-white/10 rounded p-3"
    : "whitespace-pre-line bg-gray-50 border border-gray-200 rounded p-3";
  const badgeBase = darkMode
    ? "px-3 py-1 rounded-full text-xs font-semibold border border-white/20 text-white"
    : "px-3 py-1 rounded-full text-xs font-semibold border border-gray-200 text-gray-700";

  return (
    <div className={containerClasses}>
      <div className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Denuncias</h1>
        <div className={panelClasses}>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-2">
            <input
              type="text"
              value={empresaRut}
              onChange={(e) => { setEmpresaRut(e.target.value); localStorage.setItem('empresaRut', e.target.value); }}
              placeholder="RUT empresa"
              className={inputClasses}
            />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar (rut/nombre/cargo/motivo)"
              className={inputClasses}
            />
            <select value={estado} onChange={(e) => setEstado(e.target.value)} className={inputClasses}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En revisión</option>
              <option value="resuelta">Resuelta</option>
            </select>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClasses} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClasses} />
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-2">
            <select
              value={regionFiltro}
              onChange={(e) => {
                setRegionFiltro(e.target.value);
                setComunaFiltro('');
              }}
              className={inputClasses}
            >
              <option value="">Todas las regiones</option>
              {regiones.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <select
              value={comunaFiltro}
              onChange={(e) => setComunaFiltro(e.target.value)}
              className={inputClasses}
              disabled={!regionFiltro}
            >
              <option value="">{regionFiltro ? 'Todas las comunas' : 'Selecciona región'}</option>
              {comunasFiltro.map((comuna) => (
                <option key={comuna} value={comuna}>{comuna}</option>
              ))}
            </select>
          </div>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={() => { setPage(1); fetchItems(); }}>
                Aplicar filtros
              </button>
              <select className={inputClasses} value={limit} onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}>
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}/página</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className={textMuted}>{total} resultados</span>
              <button className={buttonSecondary} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{'<'}</button>
              <span className="text-sm">{page} / {totalPages}</span>
              <button className={buttonSecondary} disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{'>'}</button>
            </div>
          </div>
          {bulkSelectedIds.length > 0 && (
            <div className="mb-3 flex items-center gap-2 text-sm">
              <span>Seleccionados: {bulkSelectedIds.length}</span>
              <button className="text-xs bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => bulkSetEstado('en_revision')}>Marcar en revisión</button>
              <button className="text-xs bg-green-600 text-white px-2 py-1 rounded" onClick={() => bulkSetEstado('resuelta')}>Marcar resueltas</button>
            </div>
          )}
          {loading && <div className={textMuted}>Cargando...</div>}
          {error && <div className="text-red-400">{error}</div>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className={tableClasses}>
                <thead>
                  <tr className={headRowClasses}>
                    <th className={`px-3 py-2 border-b ${cellBorder}`}>
                      <input
                        type="checkbox"
                        className="accent-[#FF540C]"
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const map = {};
                          items.forEach((d) => { map[d._id] = checked; });
                          setSelected(map);
                        }}
                      />
                    </th>
                    <th className={`px-3 py-2 border-b ${cellBorder}`}>Fecha</th>
                    <th className={`px-3 py-2 border-b ${cellBorder}`}>Empresa</th>
                    <th className={`px-3 py-2 border-b ${cellBorder}`}>Trabajador</th>
                    <th className={`px-3 py-2 border-b ${cellBorder}`}>Cargo</th>
                    <th className={`px-3 py-2 border-b ${cellBorder}`}>Motivo</th>
                    <th className={`px-3 py-2 border-b ${cellBorder}`}>Región</th>
                    <th className={`px-3 py-2 border-b ${cellBorder}`}>Comuna</th>
                    <th className={`px-3 py-2 border-b ${cellBorder}`}>Estado</th>
                    <th className={`px-3 py-2 border-b ${cellBorder}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr key={d._id} className={rowHover}>
                      <td className={`px-3 py-2 border-b ${cellBorder}`}>
                        <input type="checkbox" className="accent-[#FF540C]" checked={!!selected[d._id]} onChange={() => toggleSelect(d._id)} />
                      </td>
                      <td className={`px-3 py-2 border-b ${cellBorder}`}>{new Date(d.createdAt).toLocaleString()}</td>
                      <td className={`px-3 py-2 border-b ${cellBorder}`}>{d.empresaRut}</td>
                      <td className={`px-3 py-2 border-b ${cellBorder}`}>{d.nombreTrabajador || d.trabajadorRut || '-'}</td>
                      <td className={`px-3 py-2 border-b ${cellBorder}`}>{d.cargo || '-'}</td>
                      <td className={`px-3 py-2 border-b ${cellBorder}`}>{d.motivo}</td>
                      <td className={`px-3 py-2 border-b ${cellBorder}`}>{d.regionHechos || 'Sin datos'}</td>
                      <td className={`px-3 py-2 border-b ${cellBorder}`}>{d.comunaHechos || 'Sin datos'}</td>
                      <td className={`px-3 py-2 border-b ${cellBorder}`}>
                        <select value={d.estado} onChange={(e) => actualizarEstadoDenuncia(d._id, e.target.value)} className={`${inputClasses} py-1`}>
                          <option value="pendiente">pendiente</option>
                          <option value="en_revision">en revisión</option>
                          <option value="resuelta">resuelta</option>
                        </select>
                      </td>
                      <td className={`px-3 py-2 border-b ${cellBorder}`}>
                        <button className={`text-xs px-2 py-1 rounded border ${darkMode ? "border-white/30" : "border-gray-300"}`} onClick={() => verDetalle(d._id)}>
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-40" onClick={() => setDetail(null)}>
          <div className={`${modalBg} rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/60">Detalle de denuncia</p>
                <h2 className="text-xl font-semibold">#{detail._id?.slice(-6) || ''}</h2>
              </div>
              <button className="text-white/70 hover:text-white text-xl leading-none" onClick={() => setDetail(null)} aria-label="Cerrar modal">×</button>
            </div>
            <div className="px-5 py-4 space-y-6 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className={modalMuted}>Fecha de creación</p>
                  <p className="font-medium">{new Date(detail.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className={modalMuted}>Estado</p>
                  <p className="font-semibold capitalize">{detail.estado || 'pendiente'}</p>
                </div>
                <div>
                  <p className={modalMuted}>Empresa</p>
                  <p className="font-medium">{detail.empresaRut || '-'}</p>
                </div>
                <div>
                  <p className={modalMuted}>Nodo / cargo</p>
                  <p className="font-medium">{detail.cargo || '-'}</p>
                </div>
                <div>
                  <p className={modalMuted}>Trabajador denunciado</p>
                  <p className="font-medium">{detail.nombreTrabajador || detail.trabajadorRut || '-'}</p>
                </div>
                <div>
                  <p className={modalMuted}>RUT denunciado</p>
                  <p className="font-medium">{detail.trabajadorRut || '-'}</p>
                </div>
              </div>

              <div>
                <p className={`${modalMuted} mb-1`}>Motivo declarado</p>
                <p>{detail.motivo || '-'}</p>
              </div>
              {Array.isArray(detail.tipos) && detail.tipos.length > 0 && (
                <div>
                  <p className={`${modalMuted} mb-2`}>Tipos marcados</p>
                  <div className="flex flex-wrap gap-2">
                    {detail.tipos.filter(Boolean).map((tipo) => (
                      <span key={tipo} className={`px-2 py-1 rounded-full text-xs ${darkMode ? "bg-white/10 border border-white/20" : "bg-slate-100 border border-slate-200"}`}>
                        {tipo}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className={modalMuted}>Fecha o período de hechos</p>
                  <p className="font-medium">{detail.fechaOPeriodo || '-'}</p>
                </div>
                <div>
                  <p className={modalMuted}>Lugar de los hechos</p>
                  <p className="font-medium">{detail.lugarHechos || '-'}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className={modalMuted}>Región de los hechos</p>
                  <p className="font-medium">{detail.regionHechos || '-'}</p>
                </div>
                <div>
                  <p className={modalMuted}>Comuna de los hechos</p>
                  <p className="font-medium">{detail.comunaHechos || '-'}</p>
                </div>
              </div>

              <div>
                <p className={`${modalMuted} mb-1`}>Descripción detallada</p>
                <p className={modalSurface}>{detail.detalle || 'Sin descripción'}</p>
              </div>

              {(detail.evidenciaDescripcion || (detail.evidencias?.length ?? 0) > 0) && (
                <div className="space-y-3">
                  {detail.evidenciaDescripcion && (
                    <div>
                      <p className={`${modalMuted} mb-1`}>Descripción de la evidencia</p>
                      <p className={modalSurface}>{detail.evidenciaDescripcion}</p>
                    </div>
                  )}
                  {Array.isArray(detail.evidencias) && detail.evidencias.length > 0 && (
                    <div>
                      <p className={`${modalMuted} mb-2`}>Archivos adjuntos</p>
                      <div className="space-y-2">
                        {detail.evidencias.map((ev, idx) => {
                          const url = buildEvidenceUrl(ev);
                          return (
                            <div key={`${ev.filename || idx}-${idx}`} className={`border rounded-lg p-3 ${darkMode ? "bg-white/5 border-white/15" : "bg-white shadow-sm"}`}>
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-medium">{ev.originalname || ev.filename || `Archivo ${idx + 1}`}</p>
                                  <p className={`${modalMuted} normal-case`}>
                                    {ev.mimetype || 'Formato desconocido'}{ev.size ? ` · ${formatBytes(ev.size)}` : ''}
                                  </p>
                                </div>
                                {url && (
                                  <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 text-xs font-medium underline">
                                    Ver / descargar
                                  </a>
                                )}
                              </div>
                              {url && isImageMime(ev.mimetype) && (
                                <div className="mt-2">
                                  <img src={url} alt={ev.originalname || 'Evidencia'} className="max-h-64 rounded border object-contain w-full bg-white/10" />
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
                    <p className={modalMuted}>Testigo</p>
                    <p className="font-medium">{detail.testigoNombre || '-'}</p>
                  </div>
                  <div>
                    <p className={modalMuted}>Cargo / relación</p>
                    <p className="font-medium">{detail.testigoCargoRelacion || '-'}</p>
                  </div>
                  <div>
                    <p className={modalMuted}>Contacto</p>
                    <p className="font-medium break-words">{detail.testigoContacto || '-'}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <span className={`${badgeBase} ${detail.declaraVeracidad ? (darkMode ? "bg-emerald-500/20 border-emerald-400/40" : "bg-green-100 border-green-200 text-green-700") : ""}`}>
                  {detail.declaraVeracidad ? 'Declaró veracidad de los hechos' : 'Sin declaración de veracidad'}
                </span>
                <span className={`${badgeBase} ${detail.autorizaDatosPersonales ? (darkMode ? "bg-emerald-500/20 border-emerald-400/40" : "bg-green-100 border-green-200 text-green-700") : ""}`}>
                  {detail.autorizaDatosPersonales ? 'Autorizó tratamiento de datos' : 'No autorizó tratamiento de datos'}
                </span>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-white/10 flex justify-end">
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded" onClick={() => setDetail(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Denuncias;
