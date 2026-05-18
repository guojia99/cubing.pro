#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
每分钟轮询 MYCA 报名列表 API，人数变化时发送邮件（正文含当前名单与人数）。

配置：JSON 或 YAML。邮件支持两种写法（二选一）：

  - 与 cubing-pro 一致的 ``emailConfig``：smtpHost、smtpPort、from、fromName、password；
    可选 username（默认与 from 相同，QQ SMTP 须为完整邮箱）。
  - 旧版嵌套 ``smtp``：host、port、username、password、from_addr、to_addrs。

若直接复用 ``server_local_dev.yaml``，请在同一文件增加顶层块 ``myca_participant_monitor``，
写入 competition_id、interval_seconds、to_addrs 等（邮件仍读 ``global.emailConfig``）。

YAML 需：pip install pyyaml（仅 .yaml/.yml 配置文件）。

示例：
  python3 scripts/myca_participant_monitor.py --config scripts/myca.json
  python3 scripts/myca_participant_monitor.py --config cubing-pro/local/server_local_dev.yaml
  python3 scripts/myca_participant_monitor.py --config scripts/myca.json --once
"""
from __future__ import annotations

import argparse
import json
import os
import smtplib
import ssl
import sys
import time
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def _expand(path: str) -> Path:
    return Path(os.path.expanduser(path)).resolve()


def load_raw_config(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    suf = path.suffix.lower()
    if suf in (".yaml", ".yml"):
        try:
            import yaml  # type: ignore[import-untyped]
        except ImportError as e:
            raise RuntimeError("读取 YAML 请先安装: pip install pyyaml") from e
        data = yaml.safe_load(text)
        if not isinstance(data, dict):
            raise ValueError("YAML 根节点须为 mapping（字典）")
        return data
    return json.loads(text)


def _email_config_dict(cfg: dict[str, Any]) -> dict[str, Any] | None:
    if isinstance(cfg.get("emailConfig"), dict):
        return cfg["emailConfig"]
    g = cfg.get("global")
    if isinstance(g, dict) and isinstance(g.get("emailConfig"), dict):
        return g["emailConfig"]
    return None


def prepare_config(raw: dict[str, Any]) -> dict[str, Any]:
    cfg: dict[str, Any] = dict(raw)
    mon = raw.get("myca_participant_monitor")
    if isinstance(mon, dict):
        cfg.update(mon)

    defaults: dict[str, Any] = {
        "api_url": "https://www.api.mycubeassociation.org/public/GetParticipantList",
        "interval_seconds": 60,
        "state_file": "~/.cache/myca_participant_monitor_state.json",
        "http_timeout_seconds": 30,
        "participant_filter": "not_deleted",
        "send_on_first_run": False,
        "subject_prefix": "[MYCA]",
    }
    for k, v in defaults.items():
        cfg.setdefault(k, v)

    if not cfg.get("competition_id"):
        raise ValueError(
            "缺少 competition_id：请在 JSON/YAML 根级或 myca_participant_monitor 块中设置"
        )
    return cfg


def resolve_smtp_settings(cfg: dict[str, Any]) -> dict[str, Any]:
    """返回 host, port, use_tls, login_user, password, from_header, to_addrs。"""
    if isinstance(cfg.get("smtp"), dict):
        s = cfg["smtp"]
        host = s["host"]
        port = int(s.get("port", 587))
        use_tls = bool(s.get("use_tls", True))
        login_user = (s.get("username") or "").strip()
        password = str(s.get("password") or "")
        from_addr = s["from_addr"]
        to_addrs = s["to_addrs"]
        if isinstance(to_addrs, str):
            to_addrs = [to_addrs]
        from_header = from_addr
        return {
            "host": host,
            "port": port,
            "use_tls": use_tls,
            "login_user": login_user,
            "password": password,
            "from_header": from_header,
            "to_addrs": list(to_addrs),
        }

    ec = _email_config_dict(cfg)
    if not isinstance(ec, dict) or not ec.get("smtpHost"):
        raise ValueError(
            "邮件未配置：请提供 smtp 块，或与 server_local_dev 一致的 emailConfig "
            "(smtpHost, from, password 等)"
        )

    host = ec["smtpHost"]
    port = int(ec.get("smtpPort", 587))
    use_tls = bool(ec.get("useTls", ec.get("use_tls", True)))
    from_email = ec["from"]
    password = str(ec.get("password") or "")
    login_user = (ec.get("username") or from_email).strip()
    from_name = ec.get("fromName") or ec.get("from_name")
    if isinstance(from_name, str) and from_name.strip():
        from_header = formataddr((from_name.strip(), from_email))
    else:
        from_header = from_email

    to_addrs = ec.get("to") or ec.get("to_addrs") or cfg.get("to_addrs")
    if to_addrs is None:
        to_addrs = [from_email]
    if isinstance(to_addrs, str):
        to_addrs = [to_addrs]
    if not to_addrs:
        raise ValueError(
            "缺少收件人：请在 emailConfig.to / to_addrs 或顶层 to_addrs 中设置"
        )

    return {
        "host": host,
        "port": port,
        "use_tls": use_tls,
        "login_user": login_user,
        "password": password,
        "from_header": from_header,
        "to_addrs": list(to_addrs),
    }


def resolve_subject_prefix(cfg: dict[str, Any]) -> str:
    if isinstance(cfg.get("smtp"), dict) and "subject_prefix" in cfg["smtp"]:
        return str(cfg["smtp"]["subject_prefix"])
    ec = _email_config_dict(cfg)
    if isinstance(ec, dict) and ec.get("subjectPrefix") is not None:
        return str(ec["subjectPrefix"])
    if cfg.get("subject_prefix") is not None:
        return str(cfg["subject_prefix"])
    return "[MYCA]"


def fetch_participants(cfg: dict[str, Any]) -> list[dict[str, Any]]:
    url = cfg["api_url"]
    comp_id = cfg["competition_id"]
    timeout = float(cfg.get("http_timeout_seconds", 30))
    ua = cfg.get(
        "user_agent",
        "MYCA-ParticipantMonitor/1.0",
    )
    body = json.dumps({"requestData": {"CompetitionID": comp_id}}).encode("utf-8")
    req = Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": ua,
        },
    )
    with urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
    data = json.loads(raw.decode("utf-8"))
    lst = data.get("list")
    if not isinstance(lst, list):
        raise ValueError("API 响应缺少 list 数组")
    return [x for x in lst if isinstance(x, dict)]


def filter_participants(
    rows: list[dict[str, Any]], mode: str
) -> list[dict[str, Any]]:
    if mode == "all":
        return list(rows)
    if mode == "not_deleted":
        return [r for r in rows if not r.get("deleted")]
    if mode == "approved":
        return [r for r in rows if not r.get("deleted") and r.get("approved") is True]
    raise ValueError(
        f"未知 participant_filter: {mode!r}，请使用 all | not_deleted | approved"
    )


def participant_sort_key(r: dict[str, Any]) -> tuple[Any, ...]:
    return (
        (r.get("UserName") or "").lower(),
        r.get("WCAID") or "",
        r.get("ID") or "",
    )


def format_list_text(rows: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for i, r in enumerate(sorted(rows, key=participant_sort_key), start=1):
        name = r.get("UserName") or "(无姓名)"
        wca = r.get("WCAID") or "-"
        country = r.get("country") or "-"
        reg = r.get("Register_date") or "-"
        lines.append(f"{i:3d}. {name}  |  WCA: {wca}  |  {country}  |  报名: {reg}")
    return "\n".join(lines) if lines else "(无记录)"


def send_mail(cfg: dict[str, Any], subject: str, body: str) -> None:
    m = resolve_smtp_settings(cfg)
    host = m["host"]
    port = int(m["port"])
    use_tls = bool(m["use_tls"])
    user = m["login_user"]
    password = m["password"]
    from_header = m["from_header"]
    to_addrs = m["to_addrs"]

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_header
    msg["To"] = ", ".join(to_addrs)
    msg.set_content(body, charset="utf-8")

    context = ssl.create_default_context()
    with smtplib.SMTP(host, port, timeout=60) as server:
        server.ehlo()
        if use_tls:
            server.starttls(context=context)
            server.ehlo()
        if user:
            server.login(user, password)
        server.send_message(msg)


def read_state(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        with path.open(encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return None


def write_state(path: Path, count: int, competition_id: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    payload = {"competition_id": competition_id, "last_count": count}
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    tmp.replace(path)


def run_once(cfg: dict[str, Any], state_path: Path, force_notify: bool) -> int:
    mode = cfg.get("participant_filter", "not_deleted")
    rows = fetch_participants(cfg)
    filtered = filter_participants(rows, mode)
    count = len(filtered)
    comp_id = cfg["competition_id"]

    prev = read_state(state_path)
    prev_count = None if prev is None else prev.get("last_count")
    send_first = bool(cfg.get("send_on_first_run", False))

    body_lines = [
        f"比赛: {comp_id}",
        f"筛选: {mode}",
        f"当前人数: {count}",
        "",
        "—— 名单 ——",
        format_list_text(filtered),
    ]
    body = "\n".join(body_lines)

    prefix = resolve_subject_prefix(cfg)
    subject = f"{prefix} {comp_id} 报名人数 {count}"

    if force_notify:
        should_send = True
    elif prev is None:
        should_send = send_first
    elif prev_count != count:
        should_send = True
    else:
        should_send = False

    if should_send:
        send_mail(cfg, subject, body)
        print(f"已发送邮件: 人数 {prev_count} -> {count}", file=sys.stderr)
    else:
        print(f"无变化: 人数仍为 {count}", file=sys.stderr)

    write_state(state_path, count, comp_id)
    return count


def main() -> int:
    ap = argparse.ArgumentParser(description="MYCA 报名人数监控并邮件通知")
    ap.add_argument(
        "--config",
        type=Path,
        default=Path("myca_participant_monitor_config.json"),
        help="JSON 或 YAML 配置文件路径",
    )
    ap.add_argument(
        "--once",
        action="store_true",
        help="只拉取一次并退出（仍会按规则发邮件、写状态）",
    )
    ap.add_argument(
        "--notify",
        action="store_true",
        help="即使人数未变也发一封（用于测试邮件）",
    )
    args = ap.parse_args()

    cfg_path = args.config.resolve()
    if not cfg_path.is_file():
        print(f"找不到配置文件: {cfg_path}", file=sys.stderr)
        return 2

    try:
        raw = load_raw_config(cfg_path)
        cfg = prepare_config(raw)
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError, RuntimeError) as e:
        print(f"配置错误: {e}", file=sys.stderr)
        return 2
    state_path = _expand(str(cfg.get("state_file", "~/.cache/myca_participant_monitor_state.json")))
    interval = max(5, int(cfg.get("interval_seconds", 60)))

    if args.once:
        try:
            run_once(cfg, state_path, force_notify=args.notify)
        except (
            HTTPError,
            URLError,
            OSError,
            ValueError,
            json.JSONDecodeError,
            RuntimeError,
        ) as e:
            print(f"错误: {e}", file=sys.stderr)
            return 1
        return 0

    print(
        f"监控已启动: {cfg.get('competition_id')}，每 {interval}s 检查一次，Ctrl+C 退出",
        file=sys.stderr,
    )
    while True:
        try:
            run_once(cfg, state_path, force_notify=args.notify)
            args.notify = False
        except KeyboardInterrupt:
            print("已退出", file=sys.stderr)
            return 0
        except (
            HTTPError,
            URLError,
            OSError,
            ValueError,
            json.JSONDecodeError,
            RuntimeError,
        ) as e:
            print(f"本轮失败（{e}），{interval}s 后重试", file=sys.stderr)
        time.sleep(interval)


if __name__ == "__main__":
    raise SystemExit(main())
