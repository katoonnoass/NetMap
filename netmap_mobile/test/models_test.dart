import 'package:flutter_test/flutter_test.dart';
import 'package:netmap_mobile/models/project.dart';
import 'package:netmap_mobile/models/element.dart';
import 'package:netmap_mobile/models/connection.dart';
import 'package:netmap_mobile/models/auth_response.dart';
import 'package:netmap_mobile/models/incident.dart';
import 'package:netmap_mobile/models/cto_port.dart';
import 'package:netmap_mobile/models/fence.dart';
import 'package:netmap_mobile/models/address_result.dart';

void main() {
  group('Project', () {
    test('fromJson/toJson round-trip', () {
      final json = {
        'id': 'proj-123',
        'nome': 'Projeto Teste',
        'cliente': 'Cliente A',
        'cidade': 'São Paulo',
        'uf': 'SP',
        'status': 'ativo',
        'element_count': 42,
        'connection_count': 15,
      };
      final project = Project.fromJson(json);
      expect(project.id, 'proj-123');
      expect(project.nome, 'Projeto Teste');
      expect(project.cliente, 'Cliente A');
      expect(project.cidade, 'São Paulo');
      expect(project.uf, 'SP');
      expect(project.status, 'ativo');
      expect(project.elementCount, 42);
      expect(project.connectionCount, 15);

      final output = project.toJson();
      expect(output['id'], 'proj-123');
      expect(output['nome'], 'Projeto Teste');
    });

    test('fromJson handles null fields', () {
      final json = {'id': 'p1', 'nome': 'P1'};
      final project = Project.fromJson(json);
      expect(project.cliente, isNull);
      expect(project.cidade, isNull);
      expect(project.uf, isNull);
      expect(project.status, isNull);
      expect(project.elementCount, 0);
      expect(project.connectionCount, 0);
    });

    test('fromJson fallback key names', () {
      final json = {
        'id': 'p1', 'name': 'P1', 'client': 'Client X', 'city': 'Rio',
        'elements': 10, 'connections': 5,
      };
      final project = Project.fromJson(json);
      expect(project.nome, 'P1');
      expect(project.cliente, 'Client X');
      expect(project.cidade, 'Rio');
      expect(project.elementCount, 10);
      expect(project.connectionCount, 5);
    });
  });

  group('NetmapElement', () {
    test('fromJson/toJson round-trip', () {
      final json = {
        'id': 1, 'nome': 'CTO Centro', 'tipo': 'CTO',
        'lat': -23.5505, 'lng': -46.6333,
        'status': 'ativo', 'observacao': 'Obs test',
        'endereco': 'Rua X', 'cep': '01001-000',
      };
      final el = NetmapElement.fromJson(json, projetoId: 'p1');
      expect(el.id, 1);
      expect(el.nome, 'CTO Centro');
      expect(el.tipo, 'CTO');
      expect(el.lat, -23.5505);
      expect(el.lng, -46.6333);
      expect(el.status, 'ativo');
      expect(el.observacao, 'Obs test');
      expect(el.endereco, 'Rua X');
      expect(el.cep, '01001-000');
      expect(el.projetoId, 'p1');
      expect(el.hasCoords, true);

      final output = el.toJson();
      expect(output['nome'], 'CTO Centro');
      expect(output['lat'], -23.5505);
    });

    test('hasCoords false when lat/lng null', () {
      final el = NetmapElement(id: 1, nome: 'Test', tipo: 'CTO');
      expect(el.hasCoords, false);
    });

    test('copyWith', () {
      final el = NetmapElement(id: 1, nome: 'Original', tipo: 'CTO', lat: -23.0, lng: -46.0);
      final copy = el.copyWith(nome: 'Modificado', status: 'inativo');
      expect(copy.id, 1);
      expect(copy.nome, 'Modificado');
      expect(copy.status, 'inativo');
      expect(copy.lat, -23.0);
      expect(copy.lng, -46.0);
      expect(copy.tipo, 'CTO');
    });
  });

  group('Connection', () {
    test('fromJson/toJson round-trip', () {
      final json = {
        'id': 5, 'from': 1, 'to': 2,
        'fibra': 'Cabo-01', 'porta': 'P1', 'cor': 'azul',
        'length': 150.5, 'broken': true, 'obs': 'Quebrado',
        'waypoints': [
          {'lat': -23.5, 'lng': -46.6},
          {'lat': -23.6, 'lng': -46.7},
        ],
      };
      final conn = Connection.fromJson(json);
      expect(conn.id, 5);
      expect(conn.from, 1);
      expect(conn.to, 2);
      expect(conn.fibra, 'Cabo-01');
      expect(conn.porta, 'P1');
      expect(conn.cor, 'azul');
      expect(conn.length, 150.5);
      expect(conn.broken, true);
      expect(conn.obs, 'Quebrado');
      expect(conn.waypoints.length, 2);
    });

    test('non-broken connection', () {
      final json = {'id': 1, 'from': 1, 'to': 2, 'broken': false};
      final conn = Connection.fromJson(json);
      expect(conn.broken, false);
    });
  });

  group('AuthResponse', () {
    test('fromJson with ok and permissions', () {
      final json = {
        'ok': true, 'username': 'admin', 'nome': 'Admin',
        'role': 'admin', 'permissions': {'edit_elements': true},
      };
      final resp = AuthResponse.fromJson(json);
      expect(resp.ok, true);
      expect(resp.username, 'admin');
      expect(resp.nome, 'Admin');
      expect(resp.role, 'admin');
      expect(resp.canEdit, true);
      expect(resp.usingApiKey, false);
      expect(resp.error, isNull);
    });

    test('copyWith', () {
      final base = AuthResponse(
        ok: true, username: 'user', nome: 'User',
        role: 'viewer', permissions: {},
      );
      final modified = base.copyWith(role: 'editor', usingApiKey: true);
      expect(modified.role, 'editor');
      expect(modified.usingApiKey, true);
      expect(modified.username, 'user');
    });

    test('canEdit false without permission', () {
      final resp = AuthResponse(
        ok: true, username: 'v', nome: 'V',
        role: 'viewer', permissions: {},
      );
      expect(resp.canEdit, false);
    });
  });

  group('Incident', () {
    test('fromJson/toJson round-trip', () {
      final json = {
        'id': 10, 'title': 'Queda de fibra', 'status': 'open',
        'severity': 'high', 'category': 'rede',
        'element_id': 5, 'assigned_to': 'Joao',
        'notes': 'Verificar CTO Centro', 'project_id': 'p1',
        'created_at': '2024-01-15T10:30:00',
      };
      final inc = Incident.fromJson(json, projectId: 'p1');
      expect(inc.id, 10);
      expect(inc.title, 'Queda de fibra');
      expect(inc.status, 'open');
      expect(inc.severity, 'high');
      expect(inc.category, 'rede');
      expect(inc.elementId, 5);
      expect(inc.assignedTo, 'Joao');
      expect(inc.notes, 'Verificar CTO Centro');
      expect(inc.statusLabel, 'Aberto');
      expect(inc.severityLabel, 'Alta');
      expect(inc.projectId, 'p1');
    });
  });

  group('CtoPort', () {
    test('fromJson - occupied', () {
      final json = {
        'num': 3, 'status': 'ocupado',
        'client_nome': 'Maria', 'client_id': 42,
        'obs': 'Cliente desde 2023', 'splitter_type': null,
      };
      final port = CtoPort.fromJson(json);
      expect(port.num, 3);
      expect(port.isOccupied, true);
      expect(port.isFree, false);
      expect(port.isSplitter, false);
      expect(port.clientNome, 'Maria');
      expect(port.clientId, 42);
      expect(port.obs, 'Cliente desde 2023');
    });

    test('fromJson - splitter', () {
      final json = {
        'num': 5, 'status': 'splitter',
        'splitter_type': '1:4',
      };
      final port = CtoPort.fromJson(json);
      expect(port.isSplitter, true);
      expect(port.splitterType, '1:4');
    });

    test('fromJson - free', () {
      final json = {'num': 1, 'status': 'livre'};
      final port = CtoPort.fromJson(json);
      expect(port.isFree, true);
      expect(port.isOccupied, false);
    });
  });

  group('Fence', () {
    test('fromJson', () {
      final json = {
        'id': 1, 'name': 'Zona Centro', 'color': '#FF0000',
        'coordinates': [
          {'lat': -23.5, 'lng': -46.6},
          {'lat': -23.6, 'lng': -46.7},
        ],
      };
      final fence = Fence.fromJson(json);
      expect(fence.id, 1);
      expect(fence.name, 'Zona Centro');
      expect(fence.color, '#FF0000');
      expect(fence.coordinates.length, 2);
    });
  });

  group('AddressResult', () {
    test('fromJson', () {
      final json = {
        'cep': '01001-000', 'logradouro': 'Rua X',
        'bairro': 'Centro', 'localidade': 'Sao Paulo', 'uf': 'SP',
      };
      final addr = AddressResult.fromJson(json);
      expect(addr.displayAddress, contains('Rua X'));
      expect(addr.displayAddress, contains('Centro'));
      expect(addr.displayAddress, contains('Sao Paulo'));
    });
  });
}
