import React, { useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "../context/UserContext";
import fondo1 from "../Imagenes/fondo1.jpg";
import fondo2 from "../Imagenes/fondo2.jpg";
import fondo3 from "../Imagenes/fondo3.png";
import fondo4 from "../Imagenes/fondo4.png";

const Home = () => {
  const { user } = useContext(UserContext);
  // Prepara los fondos del carrusel principal (se filtran nulos por seguridad)
  const fondos = useMemo(() => [fondo1, fondo2, fondo3, fondo4].filter(Boolean), []);
  const [fondoActual, setFondoActual] = useState(0);

  useEffect(() => {
    // Avanza el fondo cada 8 segundos para mantener la portada dinámica
    if (fondos.length <= 1) return;
    const interval = setInterval(() => {
      setFondoActual((prev) => (prev + 1) % fondos.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [fondos.length]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0A4F] text-white">
      <div className="relative flex-1 overflow-hidden">
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
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D0A4F]/85 via-[#0D0A4F]/80 to-[#0D0A4F]/90" />
        </div>

        <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-16 gap-6 min-h-[85vh] w-full">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Bienvenido a <span className="text-[#FF7A3D] drop-shadow">Mi DT</span>
            </h1>
            {user ? (
              // Mensaje personalizado cuando el usuario tiene sesión iniciada
              <p className="text-base md:text-lg text-white/90">
                Hola <span className="font-semibold">{user.nombre}</span>, ingresa a tu panel para
                gestionar organigramas, seguir denuncias y acompañar a tus colaboradores.
              </p>
            ) : (
              // Texto genérico para visitantes no autenticados
              <p className="text-base md:text-lg text-white/90">
                Inicia sesion o registrate para construir tu organigrama, monitorear denuncias y
                centralizar la informacion clave del equipo.
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {!user ? (
              <>
                <a
                  href="/login"
                  className="px-6 py-3 rounded-full bg-[#5F4BDB] text-white font-semibold shadow-lg shadow-black/20 hover:bg-[#7663f0] transition"
                >
                  Iniciar sesion
                </a>
                <a
                  href="/registro"
                  className="px-6 py-3 rounded-full bg-[#FF540C] text-white font-semibold hover:bg-[#FF6A00] transition shadow-lg shadow-black/20"
                >
                  Registrarse
                </a>
              </>
            ) : (
              <>
                <a
                  href="/organigrama"
                  className="px-6 py-3 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition shadow-lg shadow-black/20"
                >
                  Ir al organigrama
                </a>
                <a
                  href="/denunciar"
                  className="px-6 py-3 rounded-full bg-rose-500 text-white font-semibold hover:bg-rose-400 transition shadow-lg shadow-black/20"
                >
                  Denuncia rapida
                </a>
              </>
            )}
          </div>
        </main>

        {fondos.length > 1 && (
          <div className="relative z-10 flex justify-center gap-2 pb-8">
            {fondos.map((_, index) => (
              <button
                key={`fondo-dot-${index}`}
                className={`h-3 w-3 rounded-full transition ${
                  index === fondoActual ? "bg-white" : "bg-white/40"
                }`}
                aria-label={`Mostrar fondo ${index + 1}`}
                onClick={() => setFondoActual(index)}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="bg-[#05032c] text-white text-center py-4 border-t border-white/10">
        <p className="text-xs tracking-wide uppercase">
          (c) 2025 Mi DT - Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};

export default Home;
