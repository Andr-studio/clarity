import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';

class AdminPanelScreen extends StatelessWidget {
  const AdminPanelScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Panel de Administrador'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final confirm = await Helpers.showConfirmDialog(
                context,
                'Cerrar Sesión',
                '¿Estás seguro de que quieres cerrar sesión?',
              );
              if (confirm && context.mounted) {
                await authProvider.logout();
                Navigator.of(context).pushReplacementNamed(AppRoutes.login);
              }
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSizes.paddingMedium),
        children: [
          // Bienvenida
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSizes.paddingMedium),
              child: Row(
                children: [
                  Helpers.buildAvatarWithInitials(
                    user?['avatar'] ?? 'AD',
                    size: 48,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Bienvenido, ${user?['nombre'] ?? 'Administrador'}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          AppTexts.getRoleName(user?['rol'] ?? ''),
                          style: const TextStyle(color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSizes.paddingLarge),

          // Opciones del panel
          _buildAdminOption(
            context,
            icon: Icons.people,
            title: 'Gestionar Usuarios',
            subtitle: 'Crear, editar y eliminar usuarios',
            color: AppColors.primary,
            onTap: () {
              Helpers.showSnackBar(context, 'Gestión de usuarios - Por implementar');
            },
          ),
          _buildAdminOption(
            context,
            icon: Icons.folder,
            title: 'Gestionar Proyectos',
            subtitle: 'Crear y administrar proyectos',
            color: AppColors.secondary,
            onTap: () {
              Helpers.showSnackBar(context, 'Gestión de proyectos - Por implementar');
            },
          ),
          _buildAdminOption(
            context,
            icon: Icons.description,
            title: 'Documentación',
            subtitle: 'Subir y gestionar documentos',
            color: AppColors.accent,
            onTap: () {
              Helpers.showSnackBar(context, 'Gestión de documentación - Por implementar');
            },
          ),
          _buildAdminOption(
            context,
            icon: Icons.event,
            title: 'Reuniones',
            subtitle: 'Agendar y gestionar reuniones',
            color: AppColors.info,
            onTap: () {
              Helpers.showSnackBar(context, 'Gestión de reuniones - Por implementar');
            },
          ),
          _buildAdminOption(
            context,
            icon: Icons.assessment,
            title: 'Reportes',
            subtitle: 'Ver estadísticas y reportes',
            color: AppColors.warning,
            onTap: () {
              Helpers.showSnackBar(context, 'Reportes - Por implementar');
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAdminOption(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppSizes.paddingMedium),
      child: ListTile(
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }
}
