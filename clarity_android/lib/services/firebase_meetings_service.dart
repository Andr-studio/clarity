import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/meeting_model.dart';

class FirebaseMeetingsService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Obtener todas las reuniones (con filtros opcionales)
  Future<List<MeetingModel>> getAll({
    String? clienteId,
    String? adminId,
    String? estado,
  }) async {
    try {
      Query query = _firestore.collection('reuniones');

      if (clienteId != null) {
        query = query.where('clienteId', isEqualTo: clienteId);
      }
      if (adminId != null) {
        query = query.where('adminId', isEqualTo: adminId);
      }
      if (estado != null) {
        query = query.where('estado', isEqualTo: estado);
      }

      query = query.orderBy('fechaCreacion', descending: true);

      final querySnapshot = await query.get();

      return querySnapshot.docs
          .map((doc) => MeetingModel.fromFirestore(doc))
          .toList();
    } catch (error) {
      print('Error obteniendo reuniones: $error');
      return [];
    }
  }

  // Obtener reunión por ID
  Future<MeetingModel?> getById(String reunionId) async {
    try {
      final doc = await _firestore.collection('reuniones').doc(reunionId).get();

      if (doc.exists) {
        return MeetingModel.fromFirestore(doc);
      }
      return null;
    } catch (error) {
      print('Error obteniendo reunión: $error');
      return null;
    }
  }

  // Crear nueva reunión
  Future<Map<String, dynamic>> create(
      Map<String, dynamic> reunionData) async {
    try {
      final docRef = await _firestore.collection('reuniones').add(reunionData);

      return {
        'success': true,
        'id': docRef.id,
        'message': 'Reunión creada exitosamente',
      };
    } catch (error) {
      print('Error creando reunión: $error');
      return {
        'success': false,
        'message': 'Error al crear reunión',
      };
    }
  }

  // Actualizar reunión
  Future<Map<String, dynamic>> update(
      String reunionId, Map<String, dynamic> updates) async {
    try {
      await _firestore.collection('reuniones').doc(reunionId).update({
        ...updates,
        'fechaActualizacion': FieldValue.serverTimestamp(),
      });

      return {
        'success': true,
        'message': 'Reunión actualizada',
      };
    } catch (error) {
      print('Error actualizando reunión: $error');
      return {
        'success': false,
        'message': 'Error al actualizar reunión',
      };
    }
  }

  // Aceptar reunión
  Future<Map<String, dynamic>> accept(String reunionId) async {
    return update(reunionId, {'estado': 'aceptada'});
  }

  // Rechazar reunión con observación y fecha alternativa
  Future<Map<String, dynamic>> reject(
      String reunionId, String? observacion, DateTime? fechaAlternativa) async {
    return update(reunionId, {
      'estado': 'rechazada',
      'observacion': observacion,
      'fechaAlternativa': fechaAlternativa != null
          ? Timestamp.fromDate(fechaAlternativa)
          : null,
    });
  }

  // Eliminar reunión
  Future<Map<String, dynamic>> delete(String reunionId) async {
    try {
      await _firestore.collection('reuniones').doc(reunionId).delete();

      return {
        'success': true,
        'message': 'Reunión eliminada',
      };
    } catch (error) {
      print('Error eliminando reunión: $error');
      return {
        'success': false,
        'message': 'Error al eliminar reunión',
      };
    }
  }

  // Obtener reuniones pendientes por cliente
  Future<List<MeetingModel>> getPendingByCliente(String clienteId) async {
    return getAll(clienteId: clienteId, estado: 'pendiente');
  }

  // Obtener reuniones por admin
  Future<List<MeetingModel>> getByAdmin(String adminId) async {
    return getAll(adminId: adminId);
  }

  // Obtener reuniones por cliente
  Future<List<MeetingModel>> getByCliente(String clienteId) async {
    return getAll(clienteId: clienteId);
  }

  // Stream de reuniones
  Stream<List<MeetingModel>> streamMeetings({
    String? clienteId,
    String? adminId,
    String? estado,
  }) {
    Query query = _firestore.collection('reuniones');

    if (clienteId != null) {
      query = query.where('clienteId', isEqualTo: clienteId);
    }
    if (adminId != null) {
      query = query.where('adminId', isEqualTo: adminId);
    }
    if (estado != null) {
      query = query.where('estado', isEqualTo: estado);
    }

    query = query.orderBy('fechaCreacion', descending: true);

    return query.snapshots().map((snapshot) {
      return snapshot.docs
          .map((doc) => MeetingModel.fromFirestore(doc))
          .toList();
    });
  }
}
