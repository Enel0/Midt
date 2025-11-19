import React, { useEffect, useMemo, useState } from "react";

const StatCard = ({ title, value, helper }) => (
  <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-2">
    <span className="text-sm uppercase tracking-wide text-gray-500">{title}</span>
    <span className="text-3xl font-bold text-[#0D0A4F]">{value ?? "-"}</span>
    {helper && <span className="text-xs text-gray-500">{helper}</span>}
  </div>
);

const BarList = ({ title, items = [], labelKey, emptyLabel }) => {
  const max = useMemo(() => Math.max(...items.map((i) => i.total), 1), [items]);
  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#0D0A4F]">{title}</h3>
        <span className="text-xs text-gray-500">Casos</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyLabel || "Sin datos suficientes"}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${labelKey}-${item[labelKey]}`} className="space-y-1.5">
              <div className="flex justify-between text-sm font-medium">
                <span>{item[labelKey]}</span>
                <span>{item.total}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtros, setFiltros] = useState({ desde: "", hasta: "" });

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filtros.desde) params.set("desde", filtros.desde);
      if (filtros.hasta) params.set("hasta", filtros.hasta);
      const url = params.toString()
        ? `http://localhost:5000/api/denuncias/estadisticas/general?${params.toString()}`
        : "http://localhost:5000/api/denuncias/estadisticas/general";
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudieron cargar las estad\u00EDsticas");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const timeline = stats?.timelineMensual || [];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0D0A4F]">Anal\u00EDtica de Denuncias</h1>
            <p className="text-sm text-gray-500">
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
            <div className="flex flex-col text-sm text-gray-600">
              <label className="font-medium mb-1" htmlFor="desde">
                Desde
              </label>
              <input
                id="desde"
                type="date"
                className="border rounded px-3 py-2"
                value={filtros.desde}
                onChange={(e) => setFiltros((prev) => ({ ...prev, desde: e.target.value }))}
              />
            </div>
            <div className="flex flex-col text-sm text-gray-600">
              <label className="font-medium mb-1" htmlFor="hasta">
                Hasta
              </label>
              <input
                id="hasta"
                type="date"
                className="border rounded px-3 py-2"
                value={filtros.hasta}
                onChange={(e) => setFiltros((prev) => ({ ...prev, hasta: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="px-6 py-2 bg-[#FF540C] hover:bg-[#FF6A00] text-white font-semibold rounded shadow"
                disabled={loading}
              >
                Aplicar filtros
              </button>
            </div>
          </form>
        </header>

        {loading && <div className="text-center text-blue-600 font-medium">Cargando datos...</div>}
        {error && !loading && (
          <div className="text-center text-red-600 font-medium">{error}</div>
        )}

        {stats && !loading && (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Denuncias registradas" value={stats.total} />
              <StatCard
                title="Regiones con casos"
                value={stats.porRegion?.length || 0}
                helper="Considerando informaci\u00F3n del trabajador denunciado"
              />
              <StatCard
                title="Estado m\u00E1s frecuente"
                value={stats.estados?.[0]?.estado || "Sin datos"}
                helper={`${stats.estados?.[0]?.total || 0} casos`}
              />
              <StatCard
                title="Edad promedio del denunciado"
                value={stats.edadesAgresores?.promedio ? `${stats.edadesAgresores.promedio} a\u00F1os` : "N/D"}
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarList
                title="Casos por regi\u00F3n"
                items={stats.porRegion || []}
                labelKey="region"
                emptyLabel="A\u00FAn no hay datos de regi\u00F3n asociados a los denunciados."
              />
              <BarList
                title="Motivos m\u00E1s frecuentes"
                items={stats.topMotivos || []}
                labelKey="motivo"
                emptyLabel="A\u00FAn no hay motivos clasificados."
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <BarList
                title="Sexo de los denunciados (agresores)"
                items={stats.sexoAgresores || []}
                labelKey="sexo"
                emptyLabel="Sin informaci\u00F3n del agresor."
              />
              <BarList
                title="Sexo de las v\u00EDctimas (denunciantes)"
                items={stats.sexoVictimas || []}
                labelKey="sexo"
                emptyLabel="Sin informaci\u00F3n asociada al denunciante."
              />
              <BarList
                title="Rangos de edad denunciados"
                items={stats.edadesAgresores?.rangos || []}
                labelKey="rango"
                emptyLabel="Sin edades registradas."
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarList
                title="Tipos de denuncia (checkbox)"
                items={stats.tiposFrecuentes || []}
                labelKey="tipo"
                emptyLabel="A\u00FAn no se han clasificado tipos en el formulario."
              />
              <BarList
                title="Estados del proceso"
                items={stats.estados || []}
                labelKey="estado"
                emptyLabel="Sin estados registrados."
              />
            </section>

            <section className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold text-[#0D0A4F] mb-4">
                Evoluci\u00F3n mensual de denuncias
              </h3>
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-500">A\u00FAn no existen registros temporalmente distribuidos.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2 pr-3 font-medium">Periodo</th>
                        <th className="py-2 font-medium">Casos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeline.map((row) => (
                        <tr key={row.periodo} className="border-t">
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

