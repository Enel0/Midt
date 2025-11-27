import React, { useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { buildApiUrl } from "../utils/api";
import logo from "../Imagenes/logo2.png";
import fondo1 from "../Imagenes/fondo1.jpg";
import fondo2 from "../Imagenes/fondo2.jpg";
import fondo3 from "../Imagenes/fondo3.png";
import fondo4 from "../Imagenes/fondo4.png";

function LoginForm() {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
  const { login } = useContext(UserContext);
  const navigate = useNavigate();

  const [step, setStep] = useState("login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [email, setEmail] = useState("");
  const [codigoGenerado, setCodigoGenerado] = useState("");
  const [codigoIngresado, setCodigoIngresado] = useState("");

  const password = watch("newPassword");

  const onLogin = async (data) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch(buildApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error de autenticación");
      }
      const { token, user } = await response.json();
      localStorage.setItem("token", token);
      login(user);
      navigate("/");
    } catch (error) {
      setErrorMessage(error.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const enviarCodigo = async () => {
    setLoading(true);
    setErrorMessage("");
    if (!email) {
      setErrorMessage("Por favor ingresa tu correo primero");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(buildApiUrl("/api/enviar-codigo"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.codigo) {
        throw new Error(data.message || "Error enviando código");
      }
      setCodigoGenerado(data.codigo);
      alert("Código enviado a tu correo");
      setStep("verifyCode");
      reset();
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verificarCodigo = () => {
    setErrorMessage("");
    if (codigoIngresado === codigoGenerado) {
      setStep("resetPassword");
      reset();
    } else {
      setErrorMessage("El código ingresado no es válido");
    }
  };

  const cambiarPassword = async (data) => {
    setLoading(true);
    setErrorMessage("");
    try {
      if (!data.newPassword) throw new Error("Ingresa una nueva contraseña");

      const res = await fetch(buildApiUrl("/api/auth/login/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          nuevaPassword: data.newPassword
        }),
      });

      const response = await res.json();
      if (!res.ok) {
        throw new Error(response.message || "Error al cambiar la contraseña");
      }

      alert("Contraseña cambiada correctamente. Ahora puedes iniciar sesión.");
      setStep("login");
      reset();
      setCodigoGenerado("");
      setCodigoIngresado("");
      setEmail("");
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10 text-white">
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

      <div className="relative z-10 w-full max-w-md bg-white/95 text-gray-800 rounded-3xl shadow-2xl p-8 backdrop-blur">
        <div className="text-center mb-6">
          <img src={logo} alt="Logo Mi DT" className="mx-auto mb-4 max-h-24 object-contain" />
          <p className="text-sm text-gray-500">Gestiona tu acceso a Mi DT con seguridad.</p>
        </div>

        {step === "login" && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Inicio de Sesión</h2>
            <form onSubmit={handleSubmit(onLogin)}>
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#FF540C]"
                  {...register("email", { required: "El correo electrónico es obligatorio" })}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">Contraseña</label>
                <input
                  type="password"
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#FF540C]"
                  {...register("password", { required: "La contraseña es obligatoria" })}
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
              </div>
              {errorMessage && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}
              <button type="submit" className="w-full bg-[#FF540C] hover:bg-[#FF6A00] text-white py-3 rounded-full font-semibold shadow">
                {loading ? "Cargando..." : "Iniciar Sesión"}
              </button>
            </form>
            <div className="text-center mt-4">
              <button
                className="text-[#FF540C] hover:underline font-medium"
                onClick={() => {
                  setStep("sendCode");
                  setErrorMessage("");
                  reset();
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </>
        )}

        {step === "sendCode" && (
          <>
            <h2 className="text-xl font-bold mb-4 text-center">Recuperar contraseña</h2>
            <input
              type="email"
              placeholder="Ingresa tu correo"
              className="w-full p-3 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-[#FF540C]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}
            <button
              className="w-full bg-[#FF540C] hover:bg-[#FF6A00] text-white py-2.5 rounded-full font-semibold shadow mb-2"
              onClick={enviarCodigo}
              disabled={loading || !email}
            >
              {loading ? "Enviando código..." : "Enviar código"}
            </button>
            <button
              className="w-full text-center text-gray-600 underline"
              onClick={() => {
                setStep("login");
                setErrorMessage("");
                reset();
              }}
            >
              Volver al inicio de sesión
            </button>
          </>
        )}

        {step === "verifyCode" && (
          <>
            <h2 className="text-xl font-bold mb-4 text-center">Ingresa el código recibido</h2>
            <input
              type="text"
              placeholder="Código"
              className="w-full p-3 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-[#FF540C]"
              value={codigoIngresado}
              onChange={(e) => setCodigoIngresado(e.target.value)}
            />
            {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}
            <button
              className="w-full bg-[#FF540C] hover:bg-[#FF6A00] text-white py-2.5 rounded-full font-semibold shadow mb-2"
              onClick={verificarCodigo}
              disabled={loading || !codigoIngresado}
            >
              Verificar código
            </button>
            <button
              className="w-full text-center text-gray-600 underline"
              onClick={() => {
                setStep("sendCode");
                setErrorMessage("");
                reset();
              }}
            >
              Volver
            </button>
          </>
        )}

        {step === "resetPassword" && (
          <>
            <h2 className="text-xl font-bold mb-4 text-center">Nueva contraseña</h2>
            <form onSubmit={handleSubmit(cambiarPassword)}>
              <input
                type="password"
                placeholder="Nueva contraseña"
                className="w-full p-3 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-[#FF540C]"
                {...register("newPassword", { required: "La contraseña es obligatoria" })}
              />
              {errors.newPassword && <p className="text-red-500 mb-2">{errors.newPassword.message}</p>}
              {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}
              <button
                type="submit"
                className="w-full bg-[#FF540C] hover:bg-[#FF6A00] text-white py-2.5 rounded-full font-semibold shadow"
                disabled={loading}
              >
                {loading ? "Cambiando contraseña..." : "Cambiar contraseña"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default LoginForm;
