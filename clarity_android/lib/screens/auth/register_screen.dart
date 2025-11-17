import 'package:flutter/material.dart';
import '../../utils/constants.dart';

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registrarse')),
      body: const Center(
        child: Text('Registro deshabilitado - Solo administradores pueden crear usuarios'),
      ),
    );
  }
}
