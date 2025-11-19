// Formulario de Denuncia
// - Permite seleccionar tipo(s) de denuncia, describir hechos,
//   adjuntar evidencias y declarar consentimientos.
// - Envía los datos como FormData (multipart) al backend.
import React, { useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

// Hook auxiliar para leer parámetros de consulta (?empresaRut=...)
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
}

const Denunciar = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
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
  const [evidencias, setEvidencias] = useState([]);
  const [evidenciaDescripcion, setEvidenciaDescripcion] = useState('');
  const [testigoNombre, setTestigoNombre] = useState('');
  const [testigoCargoRelacion, setTestigoCargoRelacion] = useState('');
  const [testigoContacto, setTestigoContacto] = useState('');
  const [declaraVeracidad, setDeclaraVeracidad] = useState(false);
  const [autorizaDatosPersonales, setAutorizaDatosPersonales] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

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
      form.append('declaraVeracidad', declaraVeracidad ? 'true' : 'false');
      form.append('autorizaDatosPersonales', autorizaDatosPersonales ? 'true' : 'false');
      // Adjuntar múltiples evidencias (si las hay)
      for (const f of evidencias) form.append('evidencias', f);
      const token = localStorage.getItem('token');
      const headers = {};
      // Adjuntar token si existe (autenticación)
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('http://localhost:5000/api/denuncias', {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Formulario de Denuncia</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <h3 className="font-semibold">Demandante</h3>
            <div className="text-sm text-gray-700">{user ? `${user.nombre || ''} (${user.email || ''})` : 'No autenticado'}</div>
          </div>
          <div className="space-y-1">
            <label htmlFor="empresaRut" className="font-semibold text-sm">Empresa</label>
            <input
              id="empresaRut"
              className="w-full border rounded p-2 text-sm"
              value={empresaRut}
              onChange={(e) => setEmpresaRut(e.target.value)}
              placeholder="RUT o nombre de la empresa"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="nombreDenunciado" className="font-semibold text-sm block mb-1">Nombre denunciado</label>
            <input
              id="nombreDenunciado"
              className="w-full border rounded p-2 text-sm"
              value={nombreTrabajador}
              onChange={(e) => setNombreTrabajador(e.target.value)}
              placeholder="Nombre completo (opcional)"
            />
          </div>
          <div>
            <label htmlFor="rutDenunciado" className="font-semibold text-sm block mb-1">RUT denunciado</label>
            <input
              id="rutDenunciado"
              className="w-full border rounded p-2 text-sm"
              value={trabajadorRut}
              onChange={(e) => setTrabajadorRut(e.target.value)}
              placeholder="11.111.111-1"
            />
          </div>
          <div>
            <label htmlFor="cargoDenunciado" className="font-semibold text-sm block mb-1">Cargo denunciado</label>
            <input
              id="cargoDenunciado"
              className="w-full border rounded p-2 text-sm"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Cargo o rol (opcional)"
            />
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold mb-2">Tipo de denuncia</h2>
            <div className="space-y-2">
              {tiposOpciones.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4" checked={tipos.includes(opt)} onChange={(e) => {
                    setTipos((prev) => e.target.checked ? [...prev, opt] : prev.filter(x => x !== opt));
                  }} />
                  <span>{opt}</span>
                </label>
              ))}
              <div className="flex items-center gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" checked={!!tipoOtro}
                    onChange={(e) => setTipoOtro(e.target.checked ? tipoOtro : '')} />
                  <span>Otras (especifique)</span>
                </label>
              </div>
              <label htmlFor="tipoOtro" className="block text-sm font-medium">Especifique otra falta o abuso</label>
              <input id="tipoOtro" className="w-full border rounded p-2" value={tipoOtro} onChange={(e)=>setTipoOtro(e.target.value)} placeholder="Especifique otra falta o abuso" />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Descripción de los hechos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="fechaOcurrencia" className="block text-sm font-medium mb-1">Fecha de ocurrencia</label>
                <input id="fechaOcurrencia" type="date" className="w-full border rounded p-2" value={fechaOPeriodo} onChange={(e)=>setFechaOPeriodo(e.target.value)} />
              </div>
              <div>
                <label htmlFor="lugarHechos" className="block text-sm font-medium mb-1">Lugar donde ocurrieron los hechos</label>
                <input id="lugarHechos" className="w-full border rounded p-2" value={lugarHechos} onChange={(e)=>setLugarHechos(e.target.value)} placeholder="Ej: Planta principal, oficina RRHH" />
              </div>
            </div>
            <label htmlFor="descripcionDetallada" className="block text-sm font-medium mb-1">Descripción detallada</label>
            <textarea id="descripcionDetallada" className="w-full border rounded p-2 h-40" value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Describa con precisión: fechas, personas involucradas, testigos, situaciones, etc." />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Evidencias (si las hay)</h2>
            <label htmlFor="evidenciasInput" className="block text-sm font-medium mb-1">Adjuntar archivos (PDF, JPG, MP4, DOCX, etc.)</label>
            <input id="evidenciasInput" type="file" multiple onChange={(e)=>setEvidencias(Array.from(e.target.files || []))}
              className="w-full border rounded p-2" accept=".pdf,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.mkv,.doc,.docx,.xls,.xlsx,.txt,.mp3,.wav" />
            <label htmlFor="evidenciaDescripcion" className="block text-sm font-medium mt-3 mb-1">Describa brevemente qué evidencia adjunta</label>
            <input id="evidenciaDescripcion" className="w-full border rounded p-2" value={evidenciaDescripcion} onChange={(e)=>setEvidenciaDescripcion(e.target.value)} placeholder="Ej: Capturas de pantalla del chat, foto del libro de asistencia" />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Testigos (opcional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="testigoNombre" className="block text-sm font-medium mb-1">Nombre(s)</label>
                <input id="testigoNombre" className="w-full border rounded p-2" value={testigoNombre} onChange={(e)=>setTestigoNombre(e.target.value)} placeholder="Nombre del testigo" />
              </div>
              <div>
                <label htmlFor="testigoCargoRelacion" className="block text-sm font-medium mb-1">Cargo o relación</label>
                <input id="testigoCargoRelacion" className="w-full border rounded p-2" value={testigoCargoRelacion} onChange={(e)=>setTestigoCargoRelacion(e.target.value)} placeholder="Cargo o relación laboral" />
              </div>
              <div>
                <label htmlFor="testigoContacto" className="block text-sm font-medium mb-1">Contacto (si autoriza)</label>
                <input id="testigoContacto" className="w-full border rounded p-2" value={testigoContacto} onChange={(e)=>setTestigoContacto(e.target.value)} placeholder="Email o teléfono" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Consentimiento y declaración</h2>
            <label className="flex items-start gap-2 text-sm mb-2">
              <input type="checkbox" className="mt-1" checked={declaraVeracidad} onChange={(e)=>setDeclaraVeracidad(e.target.checked)} />
              <span>Declaro que la información entregada es verídica y fue realizada de buena fe.</span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={autorizaDatosPersonales} onChange={(e)=>setAutorizaDatosPersonales(e.target.checked)} />
              <span>Autorizo el tratamiento de mis datos personales según la Ley N°19.628 (Chile) sobre protección de la vida privada.</span>
            </label>
            <div className="text-xs text-gray-500 mt-2">La fecha y hora de la denuncia se registrarán automáticamente.</div>
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
