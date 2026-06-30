import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/models/project.dart';
import 'package:netmap_mobile/providers/auth_provider.dart';
import 'package:netmap_mobile/providers/project_provider.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/screens/map_screen.dart';

class ProjectListScreen extends StatefulWidget {
  const ProjectListScreen({super.key});

  @override
  State<ProjectListScreen> createState() => _ProjectListScreenState();
}

class _ProjectListScreenState extends State<ProjectListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final p = Provider.of<ProjectProvider>(context, listen: false);
      if (p.projects.isEmpty && !p.isLoading) p.fetchProjects();
    });
  }

  Future<void> _refresh() async {
    await Provider.of<ProjectProvider>(context, listen: false).fetchProjects();
  }

  void _logout() => Provider.of<AuthProvider>(context, listen: false).logout();

  Future<void> _createProject() async {
    final nomeCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Novo Projeto'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(
            controller: nomeCtrl,
            decoration: const InputDecoration(
              labelText: 'Nome do projeto *',
              border: OutlineInputBorder(),
            ),
            autofocus: true,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: descCtrl,
            decoration: const InputDecoration(
              labelText: 'Descricao',
              border: OutlineInputBorder(),
            ),
            maxLines: 2,
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () {
            if (nomeCtrl.text.trim().isEmpty) return;
            Navigator.pop(ctx, true);
          }, child: const Text('Criar')),
        ],
      ),
    );
    if (result == true && nomeCtrl.text.trim().isNotEmpty) {
      try {
        final api = ApiService();
        final response = await api.post(
          ApiConfig.projectsEndpoint,
          data: {'name': nomeCtrl.text.trim(), 'description': descCtrl.text.trim()},
        );
        if (response.statusCode == 201 || response.statusCode == 200) {
          await Provider.of<ProjectProvider>(context, listen: false).fetchProjects();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Projeto criado'), behavior: SnackBarBehavior.floating),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Erro ao criar: ${e.toString().replaceFirst("ApiException", "")}')),
          );
        }
      }
    }
    nomeCtrl.dispose();
    descCtrl.dispose();
  }

  void _open(Project project) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => MapScreen(project: project)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pp = Provider.of<ProjectProvider>(context);
    final projects = pp.projects;
    return Scaffold(
      appBar: AppBar(
        title: const Text('NetMap Mobile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sair',
            onPressed: _logout,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: _buildBody(pp, projects),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createProject,
        tooltip: 'Novo projeto',
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildBody(ProjectProvider pp, List<Project> projects) {
    if (pp.isLoading && projects.isEmpty) return const _LoadingList();
    if (projects.isEmpty) return const _EmptyState();
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: projects.length,
      itemBuilder: (_, i) => _ProjectCard(
        project: projects[i],
        onTap: () => _open(projects[i]),
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  final Project project;
  final VoidCallback onTap;

  const _ProjectCard({required this.project, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      clipBehavior: Clip.antiAlias,
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      project.nome,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ),
                  if (project.elementCount > 0)
                    Chip(
                      label: Text('${project.elementCount}'),
                      padding: EdgeInsets.zero,
                      visualDensity: VisualDensity.compact,
                    ),
                ],
              ),
              const SizedBox(height: 4),
              if (project.cliente != null && project.cliente!.isNotEmpty)
                Text(
                  project.cliente!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.location_on, size: 16, color: cs.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Text(
                    '${project.cidade ?? ''}${project.uf != null ? ', ${project.uf}' : ''}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LoadingList extends StatelessWidget {
  const _LoadingList();

  @override
  Widget build(BuildContext context) {
    return const Center(child: CircularProgressIndicator());
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.folder_open_outlined,
              size: 64,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text('Nenhum projeto encontrado',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              'Puxe para baixo para atualizar',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ],
        ),
      );
}
