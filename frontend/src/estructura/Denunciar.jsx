// Formulario de Denuncia
// - Permite seleccionar tipo(s) de denuncia, describir hechos,
//   adjuntar evidencias y declarar consentimientos.
// - Envía los datos como FormData (multipart) al backend.
import React, { useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { buildApiUrl } from '../utils/api';
import { regiones, comunasByRegion } from '../utils/cl-regiones-comunas';

// Hook auxiliar para leer parámetros de consulta (?empresaRut=...)
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
}

const Denunciar = () => {
  const navigate = useNavigate();
  const { user, darkMode } = useContext(UserContext);
  const q = useQuery();

  const [empresaRut, setEmpresaRut] = useState(q.empresaRut || '');
  const nodoId = q.nodoId || '';
  const [trabajadorRut, setTrabajadorRut] = useState(q.trabajadorRut || '');
  const [nombreTrabajador, setNombreTrabajador] = useState(q.nombreTrabajador || '');
  const [cargo, setCargo] = useState(q.cargo || '');

  // Opciones predefinidas de tipos de denuncia
  const tiposOpciones = [
    'Acoso laboral',
    'Acoso sexual',
    'Despido injustificado',
    'Discriminación',
    'Irregularidades en contratos o pagos',
    'Riesgos en seguridad o salud laboral',
  ];
  const [tipos, setTipos] = useState([]);
  const [tipoOtro, setTipoOtro] = useState('');
  const [fechaOPeriodo, setFechaOPeriodo] = useState('');
  const [lugarHechos, setLugarHechos] = useState('');
  const [detalle, setDetalle] = useState('');
  const [regionHechos, setRegionHechos] = useState('');
  const [comunaHechos, setComunaHechos] = useState('');
  const [evidencias, setEvidencias] = useState([]);
  const [evidenciaDescripcion, setEvidenciaDescripcion] = useState('');
  const [testigoNombre, setTestigoNombre] = useState('');
  const [testigoCargoRelacion, setTestigoCargoRelacion] = useState('');
  const [testigoContacto, setTestigoContacto] = useState('');
  const [declaraVeracidad, setDeclaraVeracidad] = useState(false);
  const [autorizaDatosPersonales, setAutorizaDatosPersonales] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const comunasDisponibles = useMemo(() => comunasByRegion(regionHechos), [regionHechos]);

  // Envío del formulario: valida campos, arma FormData y lo envía
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    // Unificar tipos seleccionados y el campo "Otras"
    const tiposSeleccionados = [...tipos];
    if (tipoOtro.trim()) tiposSeleccionados.push(`Otras: ${tipoOtro.trim()}`);
    const motivo = tiposSeleccionados.join(', ');

    // Validaciones mínimas en frontend
    if (!empresaRut.trim()) { setError('La empresa es obligatoria'); return; }
    if (tiposSeleccionados.length === 0) { setError('Selecciona al menos un tipo de denuncia o completa "Otras"'); return; }
    if (!detalle.trim()) { setError('La descripción detallada es obligatoria'); return; }
    if (!regionHechos) { setError('Selecciona la región donde ocurrieron los hechos'); return; }
    if (!comunaHechos) { setError('Selecciona la comuna donde ocurrieron los hechos'); return; }
    if (!declaraVeracidad || !autorizaDatosPersonales) { setError('Debes aceptar las declaraciones de consentimiento'); return; }
    try {
      setSending(true);
      // Construir FormData para soportar archivos adjuntos
      const form = new FormData();
      form.append('empresaRut', empresaRut.trim());
      form.append('motivo', motivo);
      form.append('detalle', detalle);
      form.append('trabajadorRut', trabajadorRut);
      form.append('nombreTrabajador', nombreTrabajador);
      form.append('cargo', cargo);
      if (nodoId) form.append('nodoId', nodoId);
      form.append('tipos', JSON.stringify(tiposSeleccionados));
      form.append('tipoOtro', tipoOtro);
      form.append('fechaOPeriodo', fechaOPeriodo);
      form.append('lugarHechos', lugarHechos);
      form.append('evidenciaDescripcion', evidenciaDescripcion);
      form.append('testigoNombre', testigoNombre);
      form.append('testigoCargoRelacion', testigoCargoRelacion);
      form.append('testigoContacto', testigoContacto);
      form.append('regionHechos', regionHechos);
      form.append('comunaHechos', comunaHechos);
      form.append('declaraVeracidad', declaraVeracidad ? 'true' : 'false');
      form.append('autorizaDatosPersonales', autorizaDatosPersonales ? 'true' : 'false');
      // Adjuntar múltiples evidencias (si las hay)
      for (const f of evidencias) form.append('evidencias', f);
      const token = localStorage.getItem('token');
      const headers = {};
      // Adjuntar token si existe (autenticación)
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(buildApiUrl('/api/denuncias'), {
        method: 'POST',
        headers,
        body: form
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

  const containerClasses = darkMode
    ? "min-h-screen bg-[#050b1b] text-white p-6 transition-colors"
    : "min-h-screen bg-gray-50 text-[#0D0A4F] p-6 transition-colors";
  const cardClasses = darkMode
    ? "max-w-2xl mx-auto bg-[#0f162f]/95 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 p-6"
    : "max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow p-6";
  const labelClasses = darkMode ? "font-semibold text-sm text-white/90" : "font-semibold text-sm text-gray-700";
  const inputClasses = darkMode
    ? "w-full border border-white/20 bg-white/5 text-white placeholder-white/60 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF540C] disabled:opacity-40 disabled:cursor-not-allowed disabled:border-white/10"
    : "w-full border border-gray-300 bg-white text-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF540C] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed";
  const textAreaClasses = darkMode
    ? "w-full border border-white/20 bg-white/5 text-white placeholder-white/60 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF540C]"
    : "w-full border border-gray-300 bg-white text-gray-800 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF540C]";
  const sectionTitle = darkMode ? "text-lg font-semibold mb-2 text-white" : "text-lg font-semibold mb-2 text-[#0D0A4F]";
  const mutedText = darkMode ? "text-sm text-white/70" : "text-sm text-gray-600";
  const checkboxClasses = darkMode
    ? "h-4 w-4 rounded border-white/30 bg-transparent text-[#FF540C] focus:ring-[#FF540C]"
    : "h-4 w-4 rounded border-gray-300 text-[#FF540C] focus:ring-[#FF540C]";

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        <h1 className="text-2xl font-bold mb-4">Formulario de Denuncia</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <h3 className="font-semibold">Demandante</h3>
            <div className={mutedText}>{user ? `${user.nombre || ''} (${user.email || ''})` : 'No autenticado'}</div>
          </div>
          <div className="space-y-1">
            <label htmlFor="empresaRut" className={labelClasses}>Empresa</label>
            <input
              id="empresaRut"
              className={inputClasses}
              value={empresaRut}
              onChange={(e) => setEmpresaRut(e.target.value)}
              placeholder="RUT o nombre de la empresa"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="nombreDenunciado" className={`${labelClasses} block mb-1`}>Nombre denunciado</label>
            <input
              id="nombreDenunciado"
              className={inputClasses}
              value={nombreTrabajador}
              onChange={(e) => setNombreTrabajador(e.target.value)}
              placeholder="Nombre completo (opcional)"
            />
          </div>
          <div>
            <label htmlFor="rutDenunciado" className={`${labelClasses} block mb-1`}>RUT denunciado</label>
            <input
              id="rutDenunciado"
              className={inputClasses}
              value={trabajadorRut}
              onChange={(e) => setTrabajadorRut(e.target.value)}
              placeholder="11.111.111-1"
            />
          </div>
          <div>
            <label htmlFor="cargoDenunciado" className={`${labelClasses} block mb-1`}>Cargo denunciado</label>
            <input
              id="cargoDenunciado"
              className={inputClasses}
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Cargo o rol (opcional)"
            />
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <h2 className={sectionTitle}>Tipo de denuncia</h2>
            <div className="space-y-2">
              {tiposOpciones.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className={checkboxClasses} checked={tipos.includes(opt)} onChange={(e) => {
                    setTipos((prev) => e.target.checked ? [...prev, opt] : prev.filter(x => x !== opt));
                  }} />
                  <span>{opt}</span>
                </label>
              ))}
              <div className="flex items-center gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className={checkboxClasses} checked={!!tipoOtro}
                    onChange={(e) => setTipoOtro(e.target.checked ? tipoOtro : '')} />
                  <span>Otras (especifique)</span>
                </label>
              </div>
              <label htmlFor="tipoOtro" className={`${labelClasses} block`}>Especifique otra falta o abuso</label>
              <input id="tipoOtro" className={inputClasses} value={tipoOtro} onChange={(e)=>setTipoOtro(e.target.value)} placeholder="Especifique otra falta o abuso" />
            </div>
          </div>

          <div>
            <h2 className={sectionTitle}>Ubicación de los hechos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={`${labelClasses} block mb-1`} htmlFor="regionHechos">Región</label>
                <select
                  id="regionHechos"
                  className={inputClasses}
                  value={regionHechos}
                  onChange={(e) => {
                    setRegionHechos(e.target.value);
                    setComunaHechos('');
                  }}
                >
                  <option value="">Selecciona región</option>
                  {regiones.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`${labelClasses} block mb-1`} htmlFor="comunaHechos">Comuna</label>
                <select
                  id="comunaHechos"
                  className={inputClasses}
                  value={comunaHechos}
                  onChange={(e) => setComunaHechos(e.target.value)}
                  disabled={!regionHechos}
                >
                  <option value="">{regionHechos ? "Selecciona comuna" : "Primero elige región"}</option>
                  {comunasDisponibles.map((comuna) => (
                    <option key={comuna} value={comuna}>{comuna}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <h2 className={sectionTitle}>Descripción de los hechos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="fechaOcurrencia" className={`${labelClasses} block mb-1`}>Fecha de ocurrencia</label>
                <input id="fechaOcurrencia" type="date" className={inputClasses} value={fechaOPeriodo} onChange={(e)=>setFechaOPeriodo(e.target.value)} />
              </div>
              <div>
                <label htmlFor="lugarHechos" className={`${labelClasses} block mb-1`}>Lugar donde ocurrieron los hechos</label>
                <input id="lugarHechos" className={inputClasses} value={lugarHechos} onChange={(e)=>setLugarHechos(e.target.value)} placeholder="Ej: Planta principal, oficina RRHH" />
              </div>
            </div>
            <label htmlFor="descripcionDetallada" className={`${labelClasses} block mb-1`}>Descripción detallada</label>
            <textarea id="descripcionDetallada" className={`${textAreaClasses} h-40`} value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Describa con precisión: fechas, personas involucradas, testigos, situaciones, etc." />
          </div>

          <div>
            <h2 className={sectionTitle}>Evidencias (si las hay)</h2>
            <label htmlFor="evidenciasInput" className={`${labelClasses} block mb-1`}>Adjuntar archivos (PDF, JPG, MP4, DOCX, etc.)</label>
            <input id="evidenciasInput" type="file" multiple onChange={(e)=>setEvidencias(Array.from(e.target.files || []))}
              className={inputClasses} accept=".pdf,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.mkv,.doc,.docx,.xls,.xlsx,.txt,.mp3,.wav" />
            <label htmlFor="evidenciaDescripcion" className={`${labelClasses} block mt-3 mb-1`}>Describa brevemente qué evidencia adjunta</label>
            <input id="evidenciaDescripcion" className={inputClasses} value={evidenciaDescripcion} onChange={(e)=>setEvidenciaDescripcion(e.target.value)} placeholder="Ej: Capturas de pantalla del chat, foto del libro de asistencia" />
          </div>

          <div>
            <h2 className={sectionTitle}>Testigos (opcional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="testigoNombre" className={`${labelClasses} block mb-1`}>Nombre(s)</label>
                <input id="testigoNombre" className={inputClasses} value={testigoNombre} onChange={(e)=>setTestigoNombre(e.target.value)} placeholder="Nombre del testigo" />
              </div>
              <div>
                <label htmlFor="testigoCargoRelacion" className={`${labelClasses} block mb-1`}>Cargo o relación</label>
                <input id="testigoCargoRelacion" className={inputClasses} value={testigoCargoRelacion} onChange={(e)=>setTestigoCargoRelacion(e.target.value)} placeholder="Cargo o relación laboral" />
              </div>
              <div>
                <label htmlFor="testigoContacto" className={`${labelClasses} block mb-1`}>Contacto (si autoriza)</label>
                <input id="testigoContacto" className={inputClasses} value={testigoContacto} onChange={(e)=>setTestigoContacto(e.target.value)} placeholder="Email o teléfono" />
              </div>
            </div>
          </div>

          <div>
            <h2 className={sectionTitle}>Consentimiento y declaración</h2>
            <label className="flex items-start gap-2 text-sm mb-2">
              <input type="checkbox" className={`${checkboxClasses} mt-1`} checked={declaraVeracidad} onChange={(e)=>setDeclaraVeracidad(e.target.checked)} />
              <span>Declaro que la información entregada es verídica y fue realizada de buena fe.</span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className={`${checkboxClasses} mt-1`} checked={autorizaDatosPersonales} onChange={(e)=>setAutorizaDatosPersonales(e.target.checked)} />
              <span>Autorizo el tratamiento de mis datos personales según la Ley N°19.628 (Chile) sobre protección de la vida privada.</span>
            </label>
            <div className={`text-xs mt-2 ${darkMode ? "text-white/60" : "text-gray-500"}`}>La fecha y hora de la denuncia se registrarán automáticamente.</div>
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={sending} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded">
              {sending ? 'Enviando...' : 'Enviar Denuncia'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className={`px-4 py-2 rounded border ${darkMode ? "border-white/30" : "border-gray-300"}`}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Denunciar;
