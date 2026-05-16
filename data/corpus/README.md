# Corpus Queue

Drop local, licensed JSONL shards into `data/corpus/inbox/`.

Each line should be a `CrystalWorkerInput`:

```json
{"sourceKind":"manual","sourceRef":"manual:daily","title":"Daily shard","body":"意义是对抗时间的最小单位。","license":"user-provided"}
```

Run one pass:

```bash
npm run corpus:long
```

Run a local watch loop:

```bash
npm run corpus:watch -- --interval-ms 60000 --max-cycles 100
```

Outputs are written to `data/corpus/runs/<run-id>/` and processed input shards
move to `data/corpus/processed/<run-id>/`. These output directories are local
artifacts and are ignored by git.
