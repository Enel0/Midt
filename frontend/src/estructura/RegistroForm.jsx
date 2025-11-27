import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import logo from "../Imagenes/logo2.png";
import { regiones, comunasByRegion, validarRutFormato, validarRutDV, formatearRut } from "../utils/cl-regiones-comunas";
import fondo1 from "../Imagenes/fondo1.jpg";
import fondo2 from "../Imagenes/fondo2.jpg";
import fondo3 from "../Imagenes/fondo3.png";
import fondo4 from "../Imagenes/fondo4.png";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

function RegistroForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm();

  const password = watch("password");
  const email = watch("email");
  const selectedRegion = watch("region");
  const comunas = useMemo(() => comunasByRegion(selectedRegion), [selectedRegion]);

  const formatRutBody = (body) => body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const handleRutChange = (e) => {
    let only = (e.target.value || '').toUpperCase().replace(/[^\dK]/g, '');
    if (only.length === 0) {
      setValue('rut', '');
      return;
    }
    let body = only.length > 1 ? only.slice(0, -1) : only;
    let dv = only.length > 1 ? only.slice(-1) : '';
    body = body.replace(/\D/g, '').slice(0, 8);
    if (!/[0-9K]/.test(dv)) dv = '';
    let formatted = formatRutBody(body);
    if (dv) formatted = `${formatted}-${dv}`;
    formatted = formatted.slice(0, 12);
    setValue('rut', formatted, { shouldValidate: true, shouldDirty: true });
  };

  const [codigoGenerado, setCodigoGenerado] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState(false);

  const enviarCodigo = () => {
    if (!email) {
      alert("Primero ingresa tu correo electrónico");
      return;
    }

    fetch(`${API_BASE}/api/enviar-codigo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.codigo) {
          setCodigoGenerado(data.codigo);
          setCodigoEnviado(true);
          alert("Código enviado a tu correo");
        } else {
          alert("No se pudo enviar el código: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error al enviar código:", error);
        alert("Hubo un problema al enviar el correo");
      });
  };

  const onSubmit = (data) => {
    const jsonData = {
      nombre: data.firstName,
      apellido: data.lastName,
      rut: data.rut,
      fechaNacimiento: data.birthDate,
      email: data.email,
      direccion: data.address,
      region: data.region,
      comuna: data.comuna,
      sexo: data.gender,
      telefono: data.phone,
      password: data.password,
    };

    fetch(`${API_BASE}/api/auth/registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonData),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.message || `Error HTTP: ${res.status}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        if (data.create) {
          alert(data.message);
          navigate("/login");
        } else {
          alert("Error al registrar: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error.message);
        alert("Hubo un problema al registrar el usuario: " + error.message);
      });
  };

  const fondos = useMemo(() => [fondo1, fondo2, fondo3, fondo4].filter(Boolean), []);
  const [fondoActual, setFondoActual] = useState(0);

  useEffect(() => {
    if (fondos.length <= 1) return;
    const interval = setInterval(() => {
      setFondoActual((prev) => (prev + 1) % fondos.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [fondos.length]);

  return (
    <div className="min-h-screen relative overflow-hidden px-4 py-10 text-white flex items-center justify-center">
      <div className="absolute inset-0">
        {fondos.map((fondo, index) => (
          <div
            key={`${index}-${fondo}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === fondoActual ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${fondo})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050321]/90 via-[#09092f]/85 to-[#020315]/95" />
      </div>

      <div className="relative z-10 w-full max-w-4xl bg-white/95 text-gray-800 rounded-3xl shadow-2xl p-8 backdrop-blur">
        <div className="text-center mb-6">
          <img src={logo} alt="Logo Mi DT" className="mx-auto mb-4 max-h-24 object-contain" />
          <h2 className="text-2xl font-bold text-gray-800">Registro de Usuario</h2>
          <p className="text-sm text-gray-500">Completa tus datos para comenzar a gestionar con Mi DT.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Nombre</label>
            <input
              type="text"
              {...register("firstName", { required: "El nombre es obligatorio" })}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Apellido</label>
            <input
              type="text"
              {...register("lastName", { required: "El apellido es obligatorio" })}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">RUT</label>
            <input
              type="text"
              {...register("rut", {
                required: "El RUT es obligatorio",
                validate: {
                  formato: (value) => validarRutFormato(value) || "Formato inválido",
                  dv: (value) => validarRutDV(value) || "Dígito verificador incorrecto",
                },
              })}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              onChange={handleRutChange}
              placeholder="12.345.678-5"
            />
            {errors.rut && <p className="text-red-500 text-sm mt-1">{errors.rut.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Fecha de Nacimiento</label>
            <input
              type="date"
              {...register("birthDate", { required: "La fecha de nacimiento es obligatoria" })}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Correo Electrónico</label>
            <input
              type="email"
              {...register("email", {
                required: "El correo es obligatorio",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Formato de correo inválido",
                },
              })}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Dirección</label>
            <input
              type="text"
              {...register("address", { required: "La dirección es obligatoria" })}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Región</label>
            <select
              {...register("region", { required: "La región es obligatoria" })}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              defaultValue=""
            >
              <option value="">Seleccionar...</option>
              {regiones.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Comuna</label>
            <select
              {...register("comuna", { required: "La comuna es obligatoria" })}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              defaultValue=""
              disabled={!selectedRegion}
            >
              <option value="">{selectedRegion ? "Seleccionar..." : "Selecciona una región"}</option>
              {comunas.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.comuna && <p className="text-red-500 text-sm mt-1">{errors.comuna.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Género</label>
            <select
              {...register("gender", { required: "El género es obligatorio" })}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Seleccionar...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
            {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Teléfono</label>
            <input
              type="tel"
              {...register("phone", {
                required: "El teléfono es obligatorio",
                pattern: {
                  value: /^[0-9]{9}$/,
                  message: "Debe tener 9 dígitos",
                },
              })}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Contraseña</label>
            <input
              type="password"
              {...register("password", {
                required: "La contraseña es obligatoria",
                pattern: {
                  value: /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
                  message: "Debe tener 8 caracteres, una mayúscula y un símbolo",
                },
              })}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-1">Confirmar Contraseña</label>
            <input
              type="password"
              {...register("confirmPassword", {
                required: "Debes confirmar la contraseña",
                validate: (value) => value === password || "Las contraseñas no coinciden",
              })}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="col-span-full">
            <label className="block text-gray-700 font-bold mb-1">Código de verificación</label>
            {codigoEnviado ? (
              <input
                type="text"
                {...register("codigoVerificacion", {
                  required: "Debes ingresar el código enviado a tu correo",
                  validate: (value) => value === codigoGenerado || "El código ingresado no es válido",
                })}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ingresa el código recibido"
              />
            ) : (
              <button
                type="button"
                onClick={enviarCodigo}
                className="w-full bg-[#FF540C] hover:bg-[#FF6A00] text-white py-3 rounded-full font-semibold shadow"
              >
                Enviar código
              </button>
            )}
            {errors.codigoVerificacion && (
              <p className="text-red-500 text-sm mt-1">{errors.codigoVerificacion.message}</p>
            )}
          </div>
        </form>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-full font-bold shadow"
            onClick={handleSubmit(onSubmit)}
          >
            Registrar
          </button>
          <button
            type="button"
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-50"
            onClick={() => navigate("/login")}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegistroForm;
