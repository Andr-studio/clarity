import 'package:flutter/material.dart';

// Colores de la aplicación
class AppColors {
  static const Color primary = Color(0xFF6366F1); // Indigo
  static const Color secondary = Color(0xFF8B5CF6); // Purple
  static const Color accent = Color(0xFF10B981); // Green
  static const Color error = Color(0xFFEF4444); // Red
  static const Color warning = Color(0xFFF59E0B); // Amber
  static const Color info = Color(0xFF3B82F6); // Blue

  static const Color background = Color(0xFFF9FAFB);
  static const Color surface = Colors.white;
  static const Color text = Color(0xFF1F2937);
  static const Color textSecondary = Color(0xFF6B7280);

  // Estados de hitos/proyectos
  static const Color pendiente = Color(0xFF9CA3AF); // Gray
  static const Color enProgreso = Color(0xFF3B82F6); // Blue
  static const Color completado = Color(0xFF10B981); // Green
}

// Roles de usuario
class UserRoles {
  static const String admin = 'admin';
  static const String cliente = 'cliente';
  static const String team = 'team';
}

// Estados de hitos
class MilestoneStates {
  static const String pendiente = 'pendiente';
  static const String enProgreso = 'en_progreso';
  static const String completado = 'completado';
}

// Estados de proyectos
class ProjectStates {
  static const String pendiente = 'pendiente';
  static const String activo = 'activo';
  static const String enProgreso = 'en_progreso';
  static const String completado = 'completado';
}

// Estados de reuniones
class MeetingStates {
  static const String pendiente = 'pendiente';
  static const String aceptada = 'aceptada';
  static const String rechazada = 'rechazada';
}

// Textos y mensajes
class AppTexts {
  static const String appName = 'Clarity';
  static const String appDescription = 'Gestión de proyectos y hitos';

  // Login
  static const String login = 'Iniciar Sesión';
  static const String email = 'Correo Electrónico';
  static const String password = 'Contraseña';
  static const String forgotPassword = '¿Olvidaste tu contraseña?';
  static const String noAccount = '¿No tienes cuenta?';
  static const String register = 'Registrarse';

  // Errores
  static const String errorGeneral = 'Ocurrió un error';
  static const String errorNetwork = 'Error de conexión';
  static const String errorAuth = 'Error de autenticación';

  // Roles
  static String getRoleName(String rol) {
    switch (rol) {
      case UserRoles.admin:
        return 'Administrador';
      case UserRoles.cliente:
        return 'Cliente';
      case UserRoles.team:
        return 'Equipo';
      default:
        return 'Usuario';
    }
  }

  // Estados
  static String getEstadoText(String estado) {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_progreso':
        return 'En Progreso';
      case 'completado':
        return 'Completado';
      case 'activo':
        return 'Activo';
      case 'aceptada':
        return 'Aceptada';
      case 'rechazada':
        return 'Rechazada';
      default:
        return estado;
    }
  }
}

// Tamaños y espaciados
class AppSizes {
  static const double paddingSmall = 8.0;
  static const double paddingMedium = 16.0;
  static const double paddingLarge = 24.0;
  static const double paddingXLarge = 32.0;

  static const double radiusSmall = 4.0;
  static const double radiusMedium = 8.0;
  static const double radiusLarge = 12.0;
  static const double radiusXLarge = 16.0;

  static const double iconSmall = 16.0;
  static const double iconMedium = 24.0;
  static const double iconLarge = 32.0;

  static const double avatarSmall = 32.0;
  static const double avatarMedium = 48.0;
  static const double avatarLarge = 64.0;
}

// Configuraciones de Firebase
class FirebaseCollections {
  static const String usuarios = 'usuarios';
  static const String proyectos = 'proyectos';
  static const String milestones = 'milestones';
  static const String comentarios = 'comentarios';
  static const String multimedia = 'multimedia';
  static const String documentacion = 'documentacion';
  static const String reuniones = 'reuniones';
  static const String actividades = 'actividades';
}

// Rutas de navegación
class AppRoutes {
  static const String login = '/';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String dashboard = '/dashboard';
  static const String adminPanel = '/admin';
  static const String teamPanel = '/team';
}
