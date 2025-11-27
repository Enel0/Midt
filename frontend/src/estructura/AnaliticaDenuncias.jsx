import React, { useContext, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { UserContext } from "../context/UserContext";
import { buildApiUrl } from "../utils/api";

const regionesChile = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana de Santiago",
  "Libertador General Bernardo O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén del General Carlos Ibáñez del Campo",
  "Magallanes y la Antártica Chilena",
];

const StatCard = ({ title, value, helper, darkMode }) => (
  <div
    className={`rounded-xl shadow p-5 flex flex-col gap-2 ${
      darkMode ? "bg-[#0f162f] text-white border border-white/10" : "bg-white text-[#0D0A4F]"
    }`}
  >
    <span className={`text-sm uppercase tracking-wide ${darkMode ? "text-white/70" : "text-gray-500"}`}>{title}</span>
    <span className="text-3xl font-bold">{value ?? "-"}</span>
    {helper && <span className={`text-xs ${darkMode ? "text-white/60" : "text-gray-500"}`}>{helper}</span>}
  </div>
);

const BarList = ({ title, items = [], labelKey, emptyLabel, darkMode }) => {
  const max = useMemo(() => Math.max(...items.map((i) => i.total), 1), [items]);
  return (
    <div
      className={`rounded-xl shadow p-5 space-y-4 ${
        darkMode ? "bg-[#0f162f] text-white border border-white/10" : "bg-white text-[#0D0A4F]"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className={`text-xs ${darkMode ? "text-white/70" : "text-gray-500"}`}>Casos</span>
      </div>
      {items.length === 0 ? (
        <p className={`text-sm ${darkMode ? "text-white/60" : "text-gray-500"}`}>{emptyLabel || "Sin datos suficientes"}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${labelKey}-${item[labelKey]}`} className="space-y-1.5">
              <div className="flex justify-between text-sm font-medium">
                <span>{item[labelKey]}</span>
                <span>{item.total}</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${darkMode ? "bg-white/10" : "bg-gray-200"}`}>
                <div
                  className="h-full bg-gradient-to-r from-[#FF540C] to-[#FF8A3C]"
                  style={{ width: `${(item.total / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function AnaliticaDenuncias() {
  const { darkMode } = useContext(UserContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtros, setFiltros] = useState({ desde: "", hasta: "", region: "" });

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filtros.desde) params.set("desde", filtros.desde);
      if (filtros.hasta) params.set("hasta", filtros.hasta);
      if (filtros.region) params.set("region", filtros.region);
      const endpoint = "/api/denuncias/estadisticas/general";
      const query = params.toString();
      const url = buildApiUrl(query ? `${endpoint}?${query}` : endpoint);
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudieron cargar las estadísticas");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const timeline = stats?.timelineMensual || [];

  const handleExportPDF = () => {
    if (!stats) {
      alert("No hay datos para exportar.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Analítica de Denuncias", 14, 20);
    doc.setFontSize(11);

    const filtrosTexto = [
      `Desde: ${filtros.desde || "Sin definir"}`,
      `Hasta: ${filtros.hasta || "Sin definir"}`,
      `Región: ${filtros.region || "Todas"}`,
    ];
    filtrosTexto.forEach((linea, idx) => {
      doc.text(linea, 14, 30 + idx * 6);
    });

    const resumen = [
      `Total de denuncias: ${stats.total ?? "-"}`,
      `Regiones con casos: ${stats.porRegion?.length ?? 0}`,
      `Estado más frecuente: ${stats.estados?.[0]?.estado || "Sin datos"}`,
      `Edad promedio denunciados: ${
        stats.edadesAgresores?.promedio ? `${stats.edadesAgresores.promedio} años` : "N/D"
      }`,
    ];
    const resumenStart = 30 + filtrosTexto.length * 6 + 8;
    resumen.forEach((linea, idx) => {
      doc.text(linea, 14, resumenStart + idx * 6);
    });

    const regionesTop = (stats.porRegion || []).slice(0, 12);
    let regionesStart = resumenStart + resumen.length * 6 + 10;
    doc.setFontSize(12);
    doc.text("Casos por región", 14, regionesStart);
    doc.setFontSize(11);
    regionesStart += 6;

    if (regionesTop.length === 0) {
      doc.text("Sin información disponible.", 14, regionesStart);
    } else {
      regionesTop.forEach((region, idx) => {
        const y = regionesStart + idx * 6;
        if (y < 285) {
          doc.text(`${idx + 1}. ${region.region}: ${region.total}`, 14, y);
        }
      });
    }

    doc.save("analitica-denuncias.pdf");
  };

  return (
    <div className={`min-h-screen p-6 transition-colors ${darkMode ? "bg-[#050b1b] text-white" : "bg-gray-100 text-[#0D0A4F]"}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <header
          className={`rounded-2xl shadow p-6 flex flex-col gap-4 ${
            darkMode ? "bg-[#0f162f] border border-white/10" : "bg-white"
          }`}
        >
          <div>
            <h1 className="text-3xl font-bold">Analítica de Denuncias</h1>
            <p className={`text-sm ${darkMode ? "text-white/70" : "text-gray-500"}`}>
              Observa tendencias generales y encuentra patrones en las denuncias registradas.
            </p>
          </div>
          <form
            className="flex flex-col md:flex-row gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              fetchStats();
            }}
          >
            <div className={`flex flex-col text-sm ${darkMode ? "text-white/70" : "text-gray-600"}`}>
              <label className="font-medium mb-1" htmlFor="desde">
                Desde
              </label>
              <input
                id="desde"
                type="date"
                className={`border rounded px-3 py-2 ${
                  darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-300"
                }`}
                value={filtros.desde}
                onChange={(e) => setFiltros((prev) => ({ ...prev, desde: e.target.value }))}
              />
            </div>
            <div className={`flex flex-col text-sm ${darkMode ? "text-white/70" : "text-gray-600"}`}>
              <label className="font-medium mb-1" htmlFor="hasta">
                Hasta
              </label>
              <input
                id="hasta"
                type="date"
                className={`border rounded px-3 py-2 ${
                  darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-300"
                }`}
                value={filtros.hasta}
                onChange={(e) => setFiltros((prev) => ({ ...prev, hasta: e.target.value }))}
              />
            </div>
            <div className={`flex flex-col text-sm ${darkMode ? "text-white/70" : "text-gray-600"}`}>
              <label className="font-medium mb-1" htmlFor="region">
                Región
              </label>
              <select
                id="region"
                className={`border rounded px-3 py-2 ${
                  darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-300"
                }`}
                value={filtros.region}
                onChange={(e) => setFiltros((prev) => ({ ...prev, region: e.target.value }))}
              >
                <option value="">Todas las regiones</option>
                {regionesChile.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3 flex-wrap">
              <button
                type="submit"
                className="px-6 py-2 bg-[#FF540C] hover:bg-[#FF6A00] text-white font-semibold rounded shadow"
                disabled={loading}
              >
                Aplicar filtros
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                className="px-6 py-2 bg-[#0D0A4F] hover:bg-[#15106b] text-white font-semibold rounded shadow disabled:opacity-60"
                disabled={loading || !stats}
              >
                Exportar PDF
              </button>
            </div>
          </form>
        </header>

        {loading && <div className="text-center text-blue-500 font-medium">Cargando datos...</div>}
        {error && !loading && (
          <div className="text-center text-red-500 font-medium">{error}</div>
        )}

        {stats && !loading && (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg-grid-cols-4 gap-4">
              <StatCard title="Denuncias registradas" value={stats.total} darkMode={darkMode} />
              <StatCard
                title="Regiones con casos"
                value={stats.porRegion?.length || 0}
                helper="Considerando información del trabajador denunciado"
                darkMode={darkMode}
              />
              <StatCard
                title="Estado más frecuente"
                value={stats.estados?.[0]?.estado || "Sin datos"}
                helper={`${stats.estados?.[0]?.total || 0} casos`}
                darkMode={darkMode}
              />
              <StatCard
                title="Edad promedio del denunciado"
                value={stats.edadesAgresores?.promedio ? `${stats.edadesAgresores.promedio} años` : "N/D"}
                darkMode={darkMode}
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarList
                title="Casos por región"
                items={stats.porRegion || []}
                labelKey="region"
                emptyLabel="Aún no hay datos de región asociados a los denunciados."
                darkMode={darkMode}
              />
              <BarList
                title="Motivos más frecuentes"
                items={stats.topMotivos || []}
                labelKey="motivo"
                emptyLabel="Aún no hay motivos clasificados."
                darkMode={darkMode}
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <BarList
                title="Sexo de los denunciados (agresores)"
                items={stats.sexoAgresores || []}
                labelKey="sexo"
                emptyLabel="Sin información del agresor."
                darkMode={darkMode}
              />
              <BarList
                title="Sexo de las víctimas (denunciantes)"
                items={stats.sexoVictimas || []}
                labelKey="sexo"
                emptyLabel="Sin información asociada al denunciante."
                darkMode={darkMode}
              />
              <BarList
                title="Rangos de edad denunciados"
                items={stats.edadesAgresores?.rangos || []}
                labelKey="rango"
                emptyLabel="Sin edades registradas."
                darkMode={darkMode}
              />
            </section>

            <section className="grid grid-cols-1 lg-grid-cols-2 gap-6">
              <BarList
                title="Tipos de denuncia (checkbox)"
                items={stats.tiposFrecuentes || []}
                labelKey="tipo"
                emptyLabel="Aún no se han clasificado tipos en el formulario."
                darkMode={darkMode}
              />
              <BarList
                title="Estados del proceso"
                items={stats.estados || []}
                labelKey="estado"
                emptyLabel="Sin estados registrados."
                darkMode={darkMode}
              />
            </section>

            <section className={`rounded-2xl shadow p-6 ${darkMode ? "bg-[#0f162f] border border-white/10" : "bg-white"}`}>
              <h3 className="text-lg font-semibold mb-4">Evolución mensual de denuncias</h3>
              {timeline.length === 0 ? (
                <p className={`text-sm ${darkMode ? "text-white/60" : "text-gray-500"}`}>
                  Aún no existen registros temporalmente distribuidos.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`min-w-full text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                    <thead>
                      <tr className={darkMode ? "text-white/70" : "text-gray-500"}>
                        <th className="py-2 pr-3 font-medium">Periodo</th>
                        <th className="py-2 font-medium">Casos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeline.map((row) => (
                        <tr key={row.periodo} className={`border-t ${darkMode ? "border-white/10" : "border-gray-200"}`}>
                          <td className="py-2 pr-3">{row.periodo}</td>
                          <td className="py-2 font-semibold text-[#FF540C]">{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default AnaliticaDenuncias;
