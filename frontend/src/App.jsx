import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { UserProvider } from "./context/UserContext"; // Importa el contexto de usuario
import Navbar from "./components/Navbar"; // Importa la Navbar
import Home from "./estructura/Home";
import Organigrama from "./estructura/Organigrama";
// Sushi pages removed
import LoginForm from "./estructura/LoginForm";
import RegistroForm from "./estructura/RegistroForm";
import AsignarRoles from "./estructura/AsignarRoles";
import Denuncias from './estructura/Denuncias';
import Denunciar from './estructura/Denunciar';
import Perfil from './estructura/Perfil';

function App() {
  return (
    <UserProvider>
      <CartProvider>
        <BrowserRouter>
          {/* Navbar visible en todas las páginas */}
          <Navbar />

          {/* Rutas de la aplicación */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/organigrama" element={<Organigrama />} />
            {/* removed carrito/pago */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/registro" element={<RegistroForm />} />
            {/* removed estado-pedido */}

            {/* Rutas antes protegidas, ahora abiertas */}
            <Route path="/asignarRoles" element={<AsignarRoles />} />
            {/* removed ventas/productos/comandas/comments */}
            <Route path="/denuncias" element={<Denuncias />} />
            <Route path="/denunciar" element={<Denunciar />} />
            <Route path="/perfil" element={<Perfil />} />


            {/* Ruta de página no encontrada */}
            <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </UserProvider>
  );
}

export default App;
