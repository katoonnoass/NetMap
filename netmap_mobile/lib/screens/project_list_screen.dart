import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/models/project.dart';
import 'package:netmap_mobile/providers/auth_provider.dart';
import 'package:netmap_mobile/providers/project_provider.dart';
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
  Widget build(BuildContext context) => ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: 6,
        itemBuilder: (_, __) => Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Container(
            height: 90,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(width: 180, height: 16, color: Colors.black12),
                const SizedBox(height: 10),
                Container(width: 120, height: 14, color: Colors.black12),
                const SizedBox(height: 8),
                Container(width: 90, height: 12, color: Colors.black12),
              ],
            ),
          ),
        ),
      );
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
