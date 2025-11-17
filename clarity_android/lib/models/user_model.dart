import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String id;
  final String nombre;
  final String apellido;
  final String correo;
  final String rol; // 'admin', 'cliente', 'team'
  final String avatar;
  final DateTime? fechaCreacion;

  UserModel({
    required this.id,
    required this.nombre,
    required this.apellido,
    required this.correo,
    required this.rol,
    required this.avatar,
    this.fechaCreacion,
  });

  // Crear un UserModel desde un documento de Firestore
  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return UserModel(
      id: doc.id,
      nombre: data['nombre'] ?? '',
      apellido: data['apellido'] ?? '',
      correo: data['correo'] ?? '',
      rol: data['rol'] ?? 'cliente',
      avatar: data['avatar'] ?? '',
      fechaCreacion: data['fechaCreacion'] != null
          ? (data['fechaCreacion'] as Timestamp).toDate()
          : (data['fecha_creacion'] != null
              ? (data['fecha_creacion'] as Timestamp).toDate()
              : null),
    );
  }

  // Crear UserModel desde Map
  factory UserModel.fromMap(Map<String, dynamic> data, String id) {
    return UserModel(
      id: id,
      nombre: data['nombre'] ?? '',
      apellido: data['apellido'] ?? '',
      correo: data['correo'] ?? '',
      rol: data['rol'] ?? 'cliente',
      avatar: data['avatar'] ?? '',
      fechaCreacion: data['fechaCreacion'] != null
          ? (data['fechaCreacion'] as Timestamp).toDate()
          : (data['fecha_creacion'] != null
              ? (data['fecha_creacion'] as Timestamp).toDate()
              : null),
    );
  }

  // Convertir a Map para Firestore (con doble nomenclatura)
  Map<String, dynamic> toMap() {
    return {
      'nombre': nombre,
      'apellido': apellido,
      'correo': correo,
      'rol': rol,
      'avatar': avatar,
      'fechaCreacion': fechaCreacion != null ? Timestamp.fromDate(fechaCreacion!) : FieldValue.serverTimestamp(),
      'fecha_creacion': fechaCreacion != null ? Timestamp.fromDate(fechaCreacion!) : FieldValue.serverTimestamp(),
    };
  }

  // Obtener nombre completo
  String get nombreCompleto => '$nombre $apellido';

  // Copiar con cambios
  UserModel copyWith({
    String? id,
    String? nombre,
    String? apellido,
    String? correo,
    String? rol,
    String? avatar,
    DateTime? fechaCreacion,
  }) {
    return UserModel(
      id: id ?? this.id,
      nombre: nombre ?? this.nombre,
      apellido: apellido ?? this.apellido,
      correo: correo ?? this.correo,
      rol: rol ?? this.rol,
      avatar: avatar ?? this.avatar,
      fechaCreacion: fechaCreacion ?? this.fechaCreacion,
    );
  }
}
