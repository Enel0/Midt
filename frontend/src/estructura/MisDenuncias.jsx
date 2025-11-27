import React, { useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "../context/UserContext";
import { buildApiUrl } from "../utils/api";

const MisDenuncias = () => {
  const { darkMode } = useContext(UserContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchItems = async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(buildApiUrl("/api/denuncias/mias/list"));
      if (estado) url.searchParams.set("estado", estado);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(limit));
      const token = localStorage.getItem("token");
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error("No se pudieron cargar tus denuncias");
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, page, limit]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const containerClasses = darkMode
    ? "min-h-screen p-6 bg-[#050b1b] text-white transition-colors"
    : "min-h-screen p-6 bg-gray-50 text-[#0D0A4F] transition-colors";
  const controlBase = darkMode
    ? "p-2 min-w-[150px] rounded border border-white/15 bg-white/5 text-white"
    : "p-2 min-w-[150px] rounded border border-gray-300 bg-white text-gray-800";
  const tableClasses = darkMode
    ? "min-w-full border border-white/10 rounded bg-[#0f162f]/90 text-white"
    : "min-w-full border border-gray-200 rounded bg-white text-gray-800";
  const headRow = darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-left";
  const cellBorder = darkMode ? "border-white/10" : "border-gray-200";
  const rowHover = darkMode ? "hover:bg-white/5" : "hover:bg-gray-50";
  const badge = darkMode
    ? "px-2 py-1 rounded border border-white/20 text-sm"
    : "px-2 py-1 rounded border border-gray-300 text-sm";

  return (
    <div className={containerClasses}>
      <div className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold">Mis Denuncias</h1>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value);
              setPage(1);
            }}
            className={controlBase}
          >
            <option value="">Todas</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_revision">En revisión</option>
            <option value="resuelta">Resuelta</option>
          </select>
          <select
            className={controlBase}
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(1);
            }}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{`${n}/página`}</option>
            ))}
          </select>
          <button
            className="px-4 py-2 rounded bg-[#FF540C] text-white font-semibold shadow hover:bg-[#FF6A00] transition"
            onClick={() => {
              setPage(1);
              fetchItems();
            }}
          >
            Refrescar
          </button>
        </div>

        {loading && <div>Cargando...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className={tableClasses}>
              <thead>
                <tr className={headRow}>
                  <th className={`px-3 py-2 border-b ${cellBorder}`}>Fecha</th>
                  <th className={`px-3 py-2 border-b ${cellBorder}`}>Empresa</th>
                  <th className={`px-3 py-2 border-b ${cellBorder}`}>Denunciado</th>
                  <th className={`px-3 py-2 border-b ${cellBorder}`}>Cargo</th>
                  <th className={`px-3 py-2 border-b ${cellBorder}`}>Motivo</th>
                  <th className={`px-3 py-2 border-b ${cellBorder}`}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d._id} className={rowHover}>
                    <td className={`px-3 py-2 border-b ${cellBorder}`}>{new Date(d.createdAt).toLocaleString()}</td>
                    <td className={`px-3 py-2 border-b ${cellBorder}`}>{d.empresaRut}</td>
                    <td className={`px-3 py-2 border-b ${cellBorder}`}>{d.nombreTrabajador || d.trabajadorRut || '-'}</td>
                    <td className={`px-3 py-2 border-b ${cellBorder}`}>{d.cargo || '-'}</td>
                    <td className={`px-3 py-2 border-b ${cellBorder}`}>{d.motivo}</td>
                    <td className={`px-3 py-2 border-b ${cellBorder}`}>
                      <span className={badge}>{d.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3 flex-wrap text-sm">
          <span className={darkMode ? "text-white/70" : "text-gray-600"}>{total} resultados</span>
          <div className="flex items-center gap-2">
            <button
              className={`${badge} px-3`}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {'<'}
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              className={`${badge} px-3`}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {'>'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MisDenuncias;
