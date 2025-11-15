import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import Dashboard from './components/Dashboard/Dashboard';
import AdminPanel from './components/AdminPanel/AdminPanel';


function App() {
  // ✅ 2. DEFINE EL ESTADO PARA GUARDAR AL USUARIO
  // Aquí guardaremos los datos del usuario una vez que inicie sesión.
  const [currentUser, setCurrentUser] = useState(null);

  // Opcional pero recomendado: Comprobar si el usuario ya está en localStorage al cargar la app
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);


  // ✅ 3. DEFINE LA FUNCIÓN QUE FALTABA
  // Esta es la función que pasaremos al componente Login.
  // Recibe los datos del 'user' desde el componente Login.
  const handleLoginSuccess = (user) => {
    localStorage.setItem('currentUser', JSON.stringify(user)); // Guarda el usuario para persistencia
    setCurrentUser(user); // Actualiza el estado en App.js
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  return (
    // El BrowserRouter ya debe estar en tu archivo main.jsx o index.js
    <Routes>
      
      
      {/* 4. AHORA ESTA LÍNEA FUNCIONARÁ CORRECTAMENTE */}
     <Route
  path="/login"
  element={!currentUser ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to={currentUser.rol === 'admin' ? "/admin" : "/dashboard"} replace />}
/>
      
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={<Navigate to={currentUser ? (currentUser.rol === 'admin' ? "/admin" : "/dashboard") : "/login"} replace />} />

<Route
  path="/dashboard"
  element={currentUser ? <Dashboard user={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
/>

      {/* Ruta protegida solo para administradores */}
      <Route
        path="/admin"
        element={
          currentUser && currentUser.rol === 'admin'
            ? <AdminPanel user={currentUser} onLogout={handleLogout} />
            : <Navigate to="/dashboard" replace />
        }
      />

      <Route path="*" element={<h1>404: Página no encontrada</h1>} />
    </Routes>
  );
}

export default App;