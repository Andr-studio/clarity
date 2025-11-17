import 'package:flutter/material.dart';
import '../services/firebase_auth_service.dart';

class AuthProvider with ChangeNotifier {
  final FirebaseAuthService _authService = FirebaseAuthService();
  Map<String, dynamic>? _currentUser;
  bool _isLoading = false;

  Map<String, dynamic>? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _currentUser != null;

  // Verificar autenticación al inicio
  Future<bool> checkAuthentication() async {
    _isLoading = true;
    notifyListeners();

    _currentUser = await _authService.getCurrentUser();

    _isLoading = false;
    notifyListeners();

    return _currentUser != null;
  }

  // Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    final result = await _authService.login(email, password);

    if (result['success'] == true) {
      _currentUser = result['user'];
    }

    _isLoading = false;
    notifyListeners();

    return result;
  }

  // Registro
  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    _isLoading = true;
    notifyListeners();

    final result = await _authService.register(userData);

    _isLoading = false;
    notifyListeners();

    return result;
  }

  // Logout
  Future<void> logout() async {
    await _authService.logout();
    _currentUser = null;
    notifyListeners();
  }

  // Recuperar contraseña
  Future<Map<String, dynamic>> resetPassword(String email) async {
    return await _authService.resetPassword(email);
  }
}
