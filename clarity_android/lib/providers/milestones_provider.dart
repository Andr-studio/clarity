import 'package:flutter/material.dart';
import '../services/firebase_milestones_service.dart';
import '../models/milestone_model.dart';

class MilestonesProvider with ChangeNotifier {
  final FirebaseMilestonesService _milestonesService = FirebaseMilestonesService();
  List<MilestoneModel> _milestones = [];
  bool _isLoading = false;

  List<MilestoneModel> get milestones => _milestones;
  bool get isLoading => _isLoading;

  // Cargar hitos de un proyecto
  Future<void> loadMilestones(String projectId) async {
    _isLoading = true;
    notifyListeners();

    _milestones = await _milestonesService.getAll(projectId);

    _isLoading = false;
    notifyListeners();
  }

  // Crear hito
  Future<Map<String, dynamic>> createMilestone(String projectId, Map<String, dynamic> milestoneData) async {
    final result = await _milestonesService.create(projectId, milestoneData);
    if (result['success'] == true) {
      await loadMilestones(projectId);
    }
    return result;
  }

  // Actualizar hito
  Future<Map<String, dynamic>> updateMilestone(String projectId, String milestoneId, Map<String, dynamic> updates) async {
    final result = await _milestonesService.update(projectId, milestoneId, updates);
    if (result['success'] == true) {
      await loadMilestones(projectId);
    }
    return result;
  }

  // Actualizar progreso
  Future<Map<String, dynamic>> updateProgress(String projectId, String milestoneId, double progress) async {
    final result = await _milestonesService.updateProgress(projectId, milestoneId, progress);
    if (result['success'] == true) {
      await loadMilestones(projectId);
    }
    return result;
  }

  // Eliminar hito
  Future<Map<String, dynamic>> deleteMilestone(String projectId, String milestoneId) async {
    final result = await _milestonesService.delete(projectId, milestoneId);
    if (result['success'] == true) {
      _milestones.removeWhere((m) => m.id == milestoneId);
      notifyListeners();
    }
    return result;
  }
}
