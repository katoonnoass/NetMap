"""
Ponto de entrada da aplicacao.
Execute: python run.py
"""
import socket

from app import create_app
from app.services.project_service import ensure_demo, sanitize_all_projects
from app.services.user_service import ensure_admin

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        ensure_admin()
        ensure_demo()
        sanitize_all_projects()

    try:
        local_ip = socket.gethostbyname(socket.gethostname())
    except Exception:
        local_ip = "???.???.???.???"

    print("\nISP NetMap Pro rodando em:")
    print("   Local:  http://localhost:5000")
    print(f"   Rede:   http://{local_ip}:5000")
    print("\nLogin padrao inicial: admin / admin123")
    print("Troque a senha padrao assim que possivel.\n")

    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
