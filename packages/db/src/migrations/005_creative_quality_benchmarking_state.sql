UPDATE engine_settings
SET creative_gate_state = 'BENCHMARKING',
    creative_gate_evidence = '{
      "reason": "Corpus intelligence is built; hash-locked round-three benchmark pixels are under independent review.",
      "releasePolicy": "Current-hash benchmark evidence and an audited release decision are required.",
      "requiredEvidence": [
        "old-vs-new comparisons",
        "professional-anchor comparisons",
        "feed-coherence review",
        "independent pixel critiques"
      ],
      "benchmarkManifest": "artifacts/creative-rebuild/benchmarks-v2-round3/manifest.json",
      "benchmarkManifestSha256": "d30681670a5f3ac6703896e55fe5fe700c97b6ab5bce15838cc99bf196941b36"
    }'::jsonb,
    updated_at = now()
WHERE creative_production_paused = true
  AND creative_gate_state = 'CORPUS_REBUILD';
