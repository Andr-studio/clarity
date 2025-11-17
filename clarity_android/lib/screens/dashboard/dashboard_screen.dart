import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/projects_provider.dart';
import '../../providers/milestones_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final projectsProvider = Provider.of<ProjectsProvider>(context, listen: false);
    
    final user = authProvider.currentUser;
    if (user != null) {
      await projectsProvider.loadProjects(user['id'], user['rol']);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final projectsProvider = Provider.of<ProjectsProvider>(context);
    final user = authProvider.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard - Cliente'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final confirm = await Helpers.showConfirmDialog(
                context,
                'Cerrar Sesión',
                '¿Estás seguro de que quieres cerrar sesión?',
              );
              if (confirm && mounted) {
                await authProvider.logout();
                Navigator.of(context).pushReplacementNamed(AppRoutes.login);
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: projectsProvider.isLoading
            ? const Center(child: CircularProgressIndicator())
            : projectsProvider.projects.isEmpty
                ? _buildEmptyState()
                : _buildDashboardContent(user, projectsProvider),
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.folder_open, size: 80, color: Colors.grey),
          SizedBox(height: 16),
          Text(
            'No tienes proyectos asignados',
            style: TextStyle(fontSize: 18, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildDashboardContent(user, ProjectsProvider projectsProvider) {
    return ListView(
      padding: const EdgeInsets.all(AppSizes.paddingMedium),
      children: [
        // Bienvenida
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSizes.paddingMedium),
            child: Row(
              children: [
                Helpers.buildAvatarWithInitials(
                  user?['avatar'] ?? 'CL',
                  size: 48,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bienvenido, ${user?['nombre'] ?? 'Usuario'}',
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
        const SizedBox(height: AppSizes.paddingMedium),

        // Título
        const Text(
          'Mis Proyectos',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: AppSizes.paddingMedium),

        // Lista de proyectos
        ...projectsProvider.projects.map((project) => Card(
              margin: const EdgeInsets.only(bottom: AppSizes.paddingMedium),
              child: ListTile(
                leading: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Helpers.getColorByEstado(project.estado),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.folder, color: Colors.white),
                ),
                title: Text(
                  project.nombre,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      Helpers.truncateText(project.descripcion, 60),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Helpers.getColorByEstado(project.estado),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            AppTexts.getEstadoText(project.estado),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${project.progreso.toStringAsFixed(0)}% completado',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ),
                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                onTap: () {
                  projectsProvider.selectProject(project);
                  // Navegar a detalle del proyecto
                  _showProjectDetail(project);
                },
              ),
            )),
      ],
    );
  }

  void _showProjectDetail(project) async {
    // Cargar hitos del proyecto
    final milestonesProvider = Provider.of<MilestonesProvider>(context, listen: false);
    await milestonesProvider.loadMilestones(project.id);

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, controller) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: SafeArea(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              project.nombre,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, color: Colors.white),
                            onPressed: () => Navigator.pop(context),
                          ),
                        ],
                      ),
                      Text(
                        project.descripcion,
                        style: const TextStyle(color: Colors.white70),
                      ),
                    ],
                  ),
                ),
              ),
              // Hitos
              Expanded(
                child: Consumer<MilestonesProvider>(
                  builder: (context, milestonesProvider, _) {
                    if (milestonesProvider.isLoading) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    if (milestonesProvider.milestones.isEmpty) {
                      return const Center(
                        child: Text('No hay hitos en este proyecto'),
                      );
                    }

                    return ListView.builder(
                      controller: controller,
                      padding: const EdgeInsets.all(16),
                      itemCount: milestonesProvider.milestones.length,
                      itemBuilder: (context, index) {
                        final milestone = milestonesProvider.milestones[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        milestone.nombre,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Helpers.getColorByEstado(milestone.estado),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        AppTexts.getEstadoText(milestone.estado),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  milestone.descripcion,
                                  style: const TextStyle(color: Colors.grey),
                                ),
                                const SizedBox(height: 12),
                                // Barra de progreso
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text('Progreso'),
                                        Text(
                                          '${milestone.progreso.toStringAsFixed(0)}%',
                                          style: const TextStyle(fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    LinearProgressIndicator(
                                      value: milestone.progreso / 100,
                                      backgroundColor: Colors.grey[200],
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Helpers.getColorByProgreso(milestone.progreso),
                                      ),
                                    ),
                                  ],
                                ),
                                if (milestone.fechaLimite != null) ...[
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                                      const SizedBox(width: 4),
                                      Text(
                                        Helpers.getDiasRestantes(milestone.fechaLimite),
                                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                                      ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
