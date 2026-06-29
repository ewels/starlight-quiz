---
'starlight-quiz': minor
---

CLI runner additions: a `--shuffle` flag on `run` (randomises quiz and answer order) and a new `history` command that records each run to `~/.local/share/starlight-quiz/history.json` (honouring `XDG_DATA_HOME`) and lists it as a table, `--json`, or clears it with `--clear`.
