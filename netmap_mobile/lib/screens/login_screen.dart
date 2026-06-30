import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:netmap_mobile/config/api_config.dart';
import 'package:netmap_mobile/providers/auth_provider.dart';
import 'package:netmap_mobile/services/api_service.dart';
import 'package:netmap_mobile/services/storage_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _user = TextEditingController();
  final _pass = TextEditingController();
  bool _obscure = true;
  bool _remember = false;
  String? _serverUrl;

  @override
  void initState() {
    super.initState();
    _loadSaved();
  }

  Future<void> _loadSaved() async {
    final storage = StorageService.instance;
    final saved = await storage.getServerUrl();
    final username = await storage.getUsername();
    final password = await storage.getPassword();
    final remember = await storage.getRememberMe();
    if (mounted) {
      setState(() {
        _serverUrl = saved;
        _remember = remember;
        if (remember && username != null) _user.text = username;
        if (remember && password != null) _pass.text = password;
      });
    }
  }

  @override
  void dispose() {
    _user.dispose();
    _pass.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = Provider.of<AuthProvider>(context, listen: false);
    await auth.login(_user.text.trim(), _pass.text);
    if (mounted) {
      if (auth.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(auth.error!),
            backgroundColor: Theme.of(context).colorScheme.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      if (auth.isAuthenticated && _remember) {
        await StorageService.instance.savePassword(_pass.text);
      } else if (auth.isAuthenticated) {
        await StorageService.instance.deletePassword();
      }
      await StorageService.instance.saveRememberMe(_remember);
    }
  }

  Future<void> _showServerConfig() async {
    final controller = TextEditingController(
      text: _serverUrl ?? ApiConfig.baseUrl,
    );
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Servidor'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'URL do servidor',
            hintText: 'http://192.168.1.100:5005',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.dns),
          ),
          keyboardType: TextInputType.url,
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
            child: const Text('Salvar'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (result != null && result.isNotEmpty) {
      await _applyServerUrl(result);
    }
  }

  Future<void> _applyServerUrl(String url) async {
    String normalized = url;
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'http://$normalized';
    }
    if (normalized.endsWith('/')) normalized = normalized.substring(0, normalized.length - 1);
    await StorageService.instance.saveServerUrl(normalized);
    ApiConfig.baseUrl = normalized;
    ApiService.resetInstance();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    await auth.logout();
    if (mounted) {
      setState(() => _serverUrl = normalized);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Servidor alterado para $normalized'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final auth = Provider.of<AuthProvider>(context);
    return Scaffold(
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [cs.primary, cs.primaryContainer],
            ),
          ),
          child: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
                child: Card(
                  elevation: 8,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.settings, size: 20),
                                tooltip: 'Configurar servidor',
                                onPressed: _showServerConfig,
                              ),
                            ],
                          ),
                          _AppLogo(size: 72, color: cs.primary),
                          const SizedBox(height: 8),
                          Text(
                            'NetMap Mobile',
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: cs.primary,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Mapeamento de Rede',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: cs.onSurfaceVariant,
                                ),
                          ),
                          if (_serverUrl != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              _serverUrl!,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: cs.onSurfaceVariant.withValues(alpha: 0.6),
                                  ),
                              textAlign: TextAlign.center,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                          const SizedBox(height: 24),
                          TextFormField(
                            controller: _user,
                            enabled: !auth.isLoading,
                            decoration: const InputDecoration(
                              labelText: 'Usuario',
                              prefixIcon: Icon(Icons.person),
                              border: OutlineInputBorder(),
                            ),
                            textInputAction: TextInputAction.next,
                            validator: (v) => v == null || v.trim().isEmpty ? 'Informe o usuario' : null,
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _pass,
                            enabled: !auth.isLoading,
                            obscureText: _obscure,
                            decoration: InputDecoration(
                              labelText: 'Senha',
                              prefixIcon: const Icon(Icons.lock),
                              border: const OutlineInputBorder(),
                              suffixIcon: IconButton(
                                icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                                onPressed: () => setState(() => _obscure = !_obscure),
                              ),
                            ),
                            textInputAction: TextInputAction.done,
                            onFieldSubmitted: (_) => _submit(),
                            validator: (v) => v == null || v.isEmpty ? 'Informe a senha' : null,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Checkbox(
                                value: _remember,
                                onChanged: (v) => setState(() => _remember = v ?? false),
                              ),
                              GestureDetector(
                                onTap: () => setState(() => _remember = !_remember),
                                child: Text('Lembrar credenciais',
                                  style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: FilledButton(
                              style: FilledButton.styleFrom(
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              onPressed: auth.isLoading ? null : _submit,
                              child: auth.isLoading
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Text('Entrar'),
                            ),
                          ),
                          if (auth.error != null) ...[
                            const SizedBox(height: 16),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: cs.error.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: cs.error.withValues(alpha: 0.3)),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.error_outline, color: cs.error, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      auth.error!,
                                      style: TextStyle(color: cs.error, fontSize: 13),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AppLogo extends StatelessWidget {
  final double size;
  final Color color;
  const _AppLogo({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    final dotRadius = size * 0.07;
    final centerX = size / 2;
    final centerY = size / 2;
    final spread = size * 0.25;

    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _LogoPainter(color: color, dotRadius: dotRadius, centerX: centerX, centerY: centerY, spread: spread),
      ),
    );
  }
}

class _LogoPainter extends CustomPainter {
  final Color color;
  final double dotRadius, centerX, centerY, spread;

  _LogoPainter({required this.color, required this.dotRadius, required this.centerX, required this.centerY, required this.spread});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color..style = PaintingStyle.fill;
    final linePaint = Paint()..color = color..style = PaintingStyle.stroke..strokeWidth = 2.5;
    final bgPaint = Paint()..color = color.withValues(alpha: 0.12)..style = PaintingStyle.fill;

    canvas.drawCircle(Offset(centerX, centerY), size.width / 2.3, bgPaint);

    final dots = [
      Offset(centerX - spread, centerY - spread * 0.6),
      Offset(centerX + spread, centerY - spread * 0.6),
      Offset(centerX - spread * 0.5, centerY + spread * 0.8),
      Offset(centerX + spread * 0.5, centerY + spread * 0.8),
    ];

    for (int i = 0; i < dots.length; i++) {
      for (int j = i + 1; j < dots.length; j++) {
        canvas.drawLine(dots[i], dots[j], linePaint);
      }
    }

    for (final dot in dots) {
      canvas.drawCircle(dot, dotRadius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _LogoPainter old) => old.color != color;
}
