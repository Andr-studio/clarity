import 'package:cloud_firestore/cloud_firestore.dart';

class TeamMember {
  final String userId;
  final String nombre;
  final String apellido;
  final String avatar;
  final String rol;

  TeamMember({
    required this.userId,
    required this.nombre,
    required this.apellido,
    required this.avatar,
    required this.rol,
  });

  factory TeamMember.fromMap(Map<String, dynamic> data) {
    return TeamMember(
      userId: data['userId'] ?? '',
      nombre: data['nombre'] ?? '',
      apellido: data['apellido'] ?? '',
      avatar: data['avatar'] ?? '',
      rol: data['rol'] ?? 'team',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'nombre': nombre,
      'apellido': apellido,
      'avatar': avatar,
      'rol': rol,
    };
  }

  String get nombreCompleto => '$nombre $apellido';
}

class ProjectModel {
  final String id;
  final String nombre;
  final String descripcion;
  final String estado; // 'pendiente', 'activo', 'en_progreso', 'completado'
  final double presupuesto;
  final List<String> tecnologias;
  final String creadorId;
  final String creadorNombre;
  final List<TeamMember> equipo;
  final double progreso;
  final DateTime? fechaCreacion;
  final DateTime? fechaInicio;

  ProjectModel({
    required this.id,
    required this.nombre,
    required this.descripcion,
    required this.estado,
    required this.presupuesto,
    required this.tecnologias,
    required this.creadorId,
    required this.creadorNombre,
    required this.equipo,
    required this.progreso,
    this.fechaCreacion,
    this.fechaInicio,
  });

  factory ProjectModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return ProjectModel.fromMap(data, doc.id);
  }

  factory ProjectModel.fromMap(Map<String, dynamic> data, String id) {
    // Convertir equipo
    List<TeamMember> equipoList = [];
    if (data['equipo'] != null) {
      equipoList = (data['equipo'] as List)
          .map((e) => TeamMember.fromMap(e as Map<String, dynamic>))
          .toList();
    }

    // Convertir tecnologías
    List<String> tecnologiasList = [];
    if (data['tecnologias'] != null) {
      tecnologiasList = List<String>.from(data['tecnologias']);
    }

    return ProjectModel(
      id: id,
      nombre: data['nombre'] ?? '',
      descripcion: data['descripcion'] ?? '',
      estado: data['estado'] ?? 'pendiente',
      presupuesto: (data['presupuesto'] ?? 0).toDouble(),
      tecnologias: tecnologiasList,
      creadorId: data['creadorId'] ?? data['creador_id'] ?? '',
      creadorNombre: data['creadorNombre'] ?? data['creador_nombre'] ?? '',
      equipo: equipoList,
      progreso: (data['progreso'] ?? 0).toDouble(),
      fechaCreacion: data['fechaCreacion'] != null
          ? (data['fechaCreacion'] as Timestamp).toDate()
          : (data['fecha_creacion'] != null
              ? (data['fecha_creacion'] as Timestamp).toDate()
              : null),
      fechaInicio: data['fechaInicio'] != null
          ? (data['fechaInicio'] as Timestamp).toDate()
          : (data['fecha_inicio'] != null
              ? (data['fecha_inicio'] as Timestamp).toDate()
              : null),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'nombre': nombre,
      'descripcion': descripcion,
      'estado': estado,
      'presupuesto': presupuesto,
      'tecnologias': tecnologias,
      'creadorId': creadorId,
      'creador_id': creadorId, // Doble nomenclatura
      'creadorNombre': creadorNombre,
      'creador_nombre': creadorNombre, // Doble nomenclatura
      'equipo': equipo.map((e) => e.toMap()).toList(),
      'progreso': progreso,
      'fechaCreacion': fechaCreacion != null ? Timestamp.fromDate(fechaCreacion!) : FieldValue.serverTimestamp(),
      'fecha_creacion': fechaCreacion != null ? Timestamp.fromDate(fechaCreacion!) : FieldValue.serverTimestamp(),
      'fechaInicio': fechaInicio != null ? Timestamp.fromDate(fechaInicio!) : null,
      'fecha_inicio': fechaInicio != null ? Timestamp.fromDate(fechaInicio!) : null,
    };
  }

  ProjectModel copyWith({
    String? id,
    String? nombre,
    String? descripcion,
    String? estado,
    double? presupuesto,
    List<String>? tecnologias,
    String? creadorId,
    String? creadorNombre,
    List<TeamMember>? equipo,
    double? progreso,
    DateTime? fechaCreacion,
    DateTime? fechaInicio,
  }) {
    return ProjectModel(
      id: id ?? this.id,
      nombre: nombre ?? this.nombre,
      descripcion: descripcion ?? this.descripcion,
      estado: estado ?? this.estado,
      presupuesto: presupuesto ?? this.presupuesto,
      tecnologias: tecnologias ?? this.tecnologias,
      creadorId: creadorId ?? this.creadorId,
      creadorNombre: creadorNombre ?? this.creadorNombre,
      equipo: equipo ?? this.equipo,
      progreso: progreso ?? this.progreso,
      fechaCreacion: fechaCreacion ?? this.fechaCreacion,
      fechaInicio: fechaInicio ?? this.fechaInicio,
    );
  }
}
