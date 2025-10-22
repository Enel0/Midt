import React, { useContext, useState } from 'react';
import { UserContext } from '../context/UserContext';

const Perfil = () => {
  const { user } = useContext(UserContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('idle'); // idle | codeSent | verified
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const email = user?.email || '';

  const enviarCodigo = async () => {
    setError('');
    if (!email) { setError('No hay email asociado'); return; }
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/enviar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok || !data.codigo) throw new Error(data.message || 'Error enviando código');
      setCodigoGenerado(data.codigo);
      setStep('codeSent');
      alert('Código enviado a tu correo');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verificarCodigo = () => {
    setError('');
    if (codigoIngresado && codigoIngresado === codigoGenerado) {
      setStep('verified');
    } else {
      setError('El código ingresado no es válido');
    }
  };

  const cambiarPassword = async () => {
    setError('');
    if (!newPassword) { setError('Ingresa una nueva contraseña'); return; }
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/auth/login/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nuevaPassword: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cambiar la contraseña');
      alert('Contraseña cambiada correctamente');
      setStep('idle');
      setCodigoGenerado('');
      setCodigoIngresado('');
      setNewPassword('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Mi Perfil</h1>
        {user ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div><span className="font-semibold">Nombre: </span>{user.nombre || '-'}</div>
            <div><span className="font-semibold">Apellido: </span>{user.apellido || '-'}</div>
            <div><span className="font-semibold">RUT: </span>{user.rut || '-'}</div>
            <div><span className="font-semibold">Email: </span>{user.email || '-'}</div>
            <div><span className="font-semibold">Fecha Nacimiento: </span>{user.fechaNacimiento ? new Date(user.fechaNacimiento).toLocaleDateString() : '-'}</div>
            <div><span className="font-semibold">Teléfono: </span>{user.telefono || '-'}</div>
            <div><span className="font-semibold">Dirección: </span>{user.direccion || '-'}</div>
            <div><span className="font-semibold">Región: </span>{user.region || '-'}</div>
            <div><span className="font-semibold">Comuna: </span>{user.comuna || '-'}</div>
            <div><span className="font-semibold">Sexo: </span>{user.sexo || '-'}</div>
            <div><span className="font-semibold">Rol: </span>{user.rol || '-'}</div>
          </div>
        ) : (
          <div className="mb-8">No has iniciado sesión.</div>
        )}

        <h2 className="text-xl font-semibold mb-2">Cambiar contraseña</h2>
        <p className="text-sm text-gray-600 mb-4">Usaremos el mismo sistema de “Olvidé mi contraseña”: te enviaremos un código a tu correo y, al validarlo, podrás establecer una nueva contraseña.</p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Correo</label>
            <input type="email" value={email} disabled className="w-full border rounded p-2 bg-gray-100" />
          </div>
          {step === 'idle' && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" onClick={enviarCodigo} disabled={loading || !email}>
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          )}
          {step === 'codeSent' && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Código"
                value={codigoIngresado}
                onChange={(e) => setCodigoIngresado(e.target.value)}
                className="p-2 border rounded"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" onClick={verificarCodigo} disabled={loading || !codigoIngresado}>
                Verificar
              </button>
            </div>
          )}
          {step === 'verified' && (
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="p-2 border rounded"
              />
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded" onClick={cambiarPassword} disabled={loading || !newPassword}>
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </div>
          )}
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default Perfil;
