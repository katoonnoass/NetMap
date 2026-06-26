"""
Servico de agendamento de manutencao.
Tarefas de manutencao armazenadas no documento do projeto.
"""

from datetime import datetime


def list_schedules(project: dict) -> list[dict]:
    return project.get("maintenance_schedules", [])


def create_schedule(project: dict, pid: str, data: dict) -> dict:
    schedules = project.get("maintenance_schedules", [])
    sched_id = max((s.get("id", 0) for s in schedules), default=0) + 1
    sched = {
        "id": sched_id,
        "title": data.get("title", f"Manutenção {sched_id}"),
        "element_id": data.get("element_id"),
        "type": data.get("type", "preventiva"),
        "scheduled_date": data.get("scheduled_date", ""),
        "description": data.get("description", ""),
        "priority": data.get("priority", "normal"),
        "status": data.get("status", "agendada"),
        "assigned_to": data.get("assigned_to", ""),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    schedules.append(sched)
    project["maintenance_schedules"] = schedules
    return sched


def update_schedule(project: dict, sched_id: int, data: dict) -> dict | None:
    schedules = project.get("maintenance_schedules", [])
    for sched in schedules:
        if sched.get("id") == sched_id:
            for k in ("title", "element_id", "type", "scheduled_date",
                       "description", "priority", "status", "assigned_to"):
                if k in data:
                    sched[k] = data[k]
            return sched
    return None


def delete_schedule(project: dict, sched_id: int) -> bool:
    schedules = project.get("maintenance_schedules", [])
    before = len(schedules)
    project["maintenance_schedules"] = [s for s in schedules if s.get("id") != sched_id]
    return len(project["maintenance_schedules"]) < before


def upcoming_schedules(project: dict, days: int = 7) -> list[dict]:
    from datetime import timedelta
    schedules = project.get("maintenance_schedules", [])
    now = datetime.now()
    cutoff = (now + timedelta(days=days)).strftime("%Y-%m-%d")
    today = now.strftime("%Y-%m-%d")
    return [
        s for s in schedules
        if s.get("scheduled_date", "") >= today and s.get("scheduled_date", "") <= cutoff
        and s.get("status") != "concluida"
    ]
