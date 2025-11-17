import 'package:flutter/material.dart';
import '../services/firebase_projects_service.dart';
import '../models/project_model.dart';

class ProjectsProvider with ChangeNotifier {
  final FirebaseProjectsService _projectsService = FirebaseProjectsService();
  List<ProjectModel> _projects = [];
  bool _isLoading = false;
  ProjectModel? _selectedProject;

  List<ProjectModel> get projects => _projects;
  bool get isLoading => _isLoading;
  ProjectModel? get selectedProject => _selectedProject;

  // Cargar proyectos según rol
  Future<void> loadProjects(String userId, String userRol) async {
    _isLoading = true;
    notifyListeners();

    _projects = await _projectsService.getAll(userId, userRol);

    _isLoading = false;
    notifyListeners();
  }

  // Seleccionar proyecto
  void selectProject(ProjectModel project) {
    _selectedProject = project;
    notifyListeners();
  }

  // Crear proyecto
  Future<Map<String, dynamic>> createProject(Map<String, dynamic> projectData) async {
    final result = await _projectsService.create(projectData);
    if (result['success'] == true) {
      // Recargar proyectos después de crear
      notifyListeners();
    }
    return result;
  }

  // Actualizar proyecto
  Future<Map<String, dynamic>> updateProject(String projectId, Map<String, dynamic> updates) async {
    final result = await _projectsService.update(projectId, updates);
    if (result['success'] == true) {
      notifyListeners();
    }
    return result;
  }

  // Eliminar proyecto
  Future<Map<String, dynamic>> deleteProject(String projectId) async {
    final result = await _projectsService.delete(projectId);
    if (result['success'] == true) {
      _projects.removeWhere((p) => p.id == projectId);
      if (_selectedProject?.id == projectId) {
        _selectedProject = null;
      }
      notifyListeners();
    }
    return result;
  }
}
