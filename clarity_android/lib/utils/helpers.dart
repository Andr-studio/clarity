import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'constants.dart';

class Helpers {
  // Formatear fecha
  static String formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    return DateFormat('dd/MM/yyyy').format(date);
  }

  // Formatear fecha y hora
  static String formatDateTime(DateTime? date) {
    if (date == null) return 'N/A';
    return DateFormat('dd/MM/yyyy HH:mm').format(date);
  }

  // Formatear fecha relativa (hace X días)
  static String formatRelativeDate(DateTime? date) {
    if (date == null) return 'N/A';

    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      if (difference.inHours == 0) {
        if (difference.inMinutes == 0) {
          return 'Ahora';
        }
        return 'Hace ${difference.inMinutes} min';
      }
      return 'Hace ${difference.inHours} h';
    } else if (difference.inDays == 1) {
      return 'Ayer';
    } else if (difference.inDays < 7) {
      return 'Hace ${difference.inDays} días';
    } else if (difference.inDays < 30) {
      return 'Hace ${(difference.inDays / 7).floor()} semanas';
    } else if (difference.inDays < 365) {
      return 'Hace ${(difference.inDays / 30).floor()} meses';
    } else {
      return 'Hace ${(difference.inDays / 365).floor()} años';
    }
  }

  // Obtener color según estado
  static Color getColorByEstado(String estado) {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return AppColors.pendiente;
      case 'en_progreso':
      case 'activo':
        return AppColors.enProgreso;
      case 'completado':
        return AppColors.completado;
      case 'rechazada':
        return AppColors.error;
      case 'aceptada':
        return AppColors.accent;
      default:
        return AppColors.textSecondary;
    }
  }

  // Obtener color según progreso
  static Color getColorByProgreso(double progreso) {
    if (progreso == 0) {
      return AppColors.pendiente;
    } else if (progreso == 100) {
      return AppColors.completado;
    } else {
      return AppColors.enProgreso;
    }
  }

  // Validar email
  static bool isValidEmail(String email) {
    final regex = RegExp(
        r'^[a-zA-Z0-9.]+@[a-zA-Z0-9]+\.[a-zA-Z]+');
    return regex.hasMatch(email);
  }

  // Validar contraseña (mínimo 6 caracteres)
  static bool isValidPassword(String password) {
    return password.length >= 6;
  }

  // Generar avatar con iniciales
  static Widget buildAvatarWithInitials(String initials, {double size = 40}) {
    final colors = [
      AppColors.primary,
      AppColors.secondary,
      AppColors.accent,
      AppColors.info,
      AppColors.warning,
    ];

    // Seleccionar color basado en las iniciales
    final colorIndex = initials.codeUnits.fold(0, (sum, code) => sum + code) % colors.length;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: colors[colorIndex],
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initials.toUpperCase(),
          style: TextStyle(
            color: Colors.white,
            fontSize: size * 0.4,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  // Mostrar SnackBar
  static void showSnackBar(BuildContext context, String message,
      {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.error : AppColors.accent,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  // Mostrar diálogo de confirmación
  static Future<bool> showConfirmDialog(
    BuildContext context,
    String title,
    String message,
  ) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  // Formatear tamaño de archivo
  static String formatFileSize(int bytes) {
    if (bytes < 1024) {
      return '$bytes B';
    } else if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    } else {
      return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
    }
  }

  // Calcular días restantes
  static String getDiasRestantes(DateTime? fechaLimite) {
    if (fechaLimite == null) return 'Sin fecha límite';

    final now = DateTime.now();
    final difference = fechaLimite.difference(now);

    if (difference.isNegative) {
      return 'Vencido hace ${difference.inDays.abs()} días';
    } else if (difference.inDays == 0) {
      return 'Vence hoy';
    } else if (difference.inDays == 1) {
      return 'Vence mañana';
    } else {
      return 'Faltan ${difference.inDays} días';
    }
  }

  // Parsear fecha desde timestamp de Firestore
  static DateTime? parseTimestamp(dynamic timestamp) {
    if (timestamp == null) return null;

    try {
      if (timestamp is DateTime) {
        return timestamp;
      } else if (timestamp is Map && timestamp.containsKey('seconds')) {
        return DateTime.fromMillisecondsSinceEpoch(
            timestamp['seconds'] * 1000);
      }
    } catch (e) {
      print('Error parseando timestamp: $e');
    }

    return null;
  }

  // Truncar texto
  static String truncateText(String text, int maxLength) {
    if (text.length <= maxLength) return text;
    return '${text.substring(0, maxLength)}...';
  }
}
