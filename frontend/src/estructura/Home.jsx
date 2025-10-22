import React, { useContext } from "react";
import { UserContext } from "../context/UserContext";

const Home = () => {
  const { user } = useContext(UserContext);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Contenido principal */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-bold text-blue-900 mb-4">
          Bienvenido a <span className="text-orange-600">Mi DT</span>
        </h1>

        {user ? (
          <p className="text-lg text-gray-700">
            Hola <span className="font-semibold">{user.nombre}</span>, accede a
            tu panel para gestionar el organigrama y consultar información de
            los trabajadores.
          </p>
        ) : (
          <p className="text-lg text-gray-700">
            Inicia sesión o regístrate para comenzar a gestionar tu organigrama.
          </p>
        )}

        <div className="mt-8 flex gap-4">
          {!user ? (
            <>
              <a
                href="/login"
                className="px-6 py-3 rounded-2xl bg-blue-900 text-white hover:bg-blue-700 transition"
              >
                Iniciar Sesión
              </a>
              <a
                href="/registro"
                className="px-6 py-3 rounded-2xl bg-orange-600 text-white hover:bg-orange-500 transition"
              >
                Registrarse
              </a>
            </>
          ) : (
            <a
              href="/organigrama"
              className="px-6 py-3 rounded-2xl bg-green-600 text-white hover:bg-green-500 transition"
            >
              Ir al Organigrama
            </a>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white text-center py-4">
        <p className="text-sm">© 2025 Mi DT. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Home;
