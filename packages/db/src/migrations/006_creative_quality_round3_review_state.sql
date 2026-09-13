UPDATE engine_settings
SET creative_production_paused = true,
    creative_gate_state = 'BENCHMARKING',
    creative_gate_evidence = '{
      "reason": "Round-three candidate 01 decisively beats its matched legacy output in one controlled neutral-label identical-brief comparison, and four candidates form a critic-only professional upper tier. This is not suite-wide proof, and the complete suite has not cleared the release contract.",
      "releasePolicy": "Keep POST_PRODUCTION claims held until revised current hashes clear every required critic, originality, feed, rights, technical, and owner gate.",
      "benchmarkManifest": {
        "path": "artifacts/creative-rebuild/benchmarks-v2-round3/manifest.json",
        "sha256": "d30681670a5f3ac6703896e55fe5fe700c97b6ab5bce15838cc99bf196941b36",
        "archiveState": "HASH_ANCHORED_TAMPER_EVIDENT_NOT_FILESYSTEM_IMMUTABLE"
      },
      "independentReviews": [
        {
          "role": "SENIOR_ART_DIRECTOR",
          "path": "artifacts/creative-rebuild/reviews/senior-art-director-round3.json",
          "sha256": "db1e37dadbacaff1f2e0a90c99e375dabe04636f87f63b5bd032de610591d3cb"
        },
        {
          "role": "SENIOR_GRAPHIC_DESIGNER",
          "path": "artifacts/creative-rebuild/reviews/senior-graphic-designer-round3.json",
          "sha256": "284259515335e399f7549b36ef1c30f584f9489ae050668de13ed179ca48a7f1"
        },
        {
          "role": "SOCIAL_PERFORMANCE_STRATEGIST",
          "path": "artifacts/creative-rebuild/reviews/social-performance-strategist-round3.json",
          "sha256": "fcb9a70ff09ddbf46c79aeaa344a18851945f35fb23cc1ac45ec6d9a98a04aa3"
        },
        {
          "role": "ARABIC_DESIGN_REVIEWER",
          "path": "artifacts/creative-rebuild/reviews/arabic-design-reviewer-round3.json",
          "sha256": "076f1dad0af979e61df93373ea39263a5478dc983d201ce8f003c0bb13542dea"
        },
        {
          "role": "ORIGINALITY_REVIEWER",
          "path": "artifacts/creative-rebuild/originality/round3-originality-review.json",
          "sha256": "1475707a4c555b387118f8b513b2d85c330f0718e0c4dd1f18bc04afed28186f"
        },
        {
          "role": "INDEPENDENT_BLIND_ADJUDICATOR",
          "path": "artifacts/creative-rebuild/blind-pairwise/round3-old-vs-new/blind-review.json",
          "sha256": "49b5623b8e0f84ebef8698d5a97e2fc931da618303deab0d5c8e643f8c05de15"
        }
      ],
      "integratedCritiqueSets": {
        "path": "artifacts/creative-rebuild/reviews/round3-critique-sets.json",
        "sha256": "849cec4cb238afedd4ec533d92a7fb8a38d9e5cc63c359802d8def612753a4ca"
      },
      "integratedCritiqueReport": {
        "path": "artifacts/creative-rebuild/reviews/ROUND3_INTEGRATED_CRITIQUE_REPORT.md",
        "sha256": "5bf504df550902f0d55d4df94a9c9feb059b24f8fbef5895944e96f2883fae7c"
      },
      "evidenceCaveats": [
        {
          "code": "HISTORICAL_GOLDEN_SET_BYTES_NOT_RETAINED_AT_MUTABLE_PATH",
          "path": "design-intelligence/reports/GOLDEN_SET.md",
          "reviewedSha256": "9f5c1bf70d9d491e2c0ca4a25cddf653bda48375d77c6c570f9dfb5e66bbc36e",
          "currentDocumentSha256": "8d9914a0f51dc6050b25ae9ac134a84c7528da5c67cc8b35790dea6542fb4398",
          "affectedReviewRoles": [
            "SENIOR_ART_DIRECTOR",
            "SENIOR_GRAPHIC_DESIGNER",
            "SOCIAL_PERFORMANCE_STRATEGIST"
          ],
          "note": "The independent reviews remain unchanged to preserve their exact hashes. The historical governance bytes are not reproducible from the later mutable GOLDEN_SET.md path."
        }
      ],
      "round3Outcome": {
        "professionalCritiqueCandidates": [
          "01-ar-context-handoff",
          "02-ar-rag-evidence",
          "07-en-evidence-ledger",
          "12-en-complexity-answerable"
        ],
        "criticAndCandidateOriginalityClear": [
          "01-ar-context-handoff",
          "02-ar-rag-evidence"
        ],
        "originalityBlockedByFeedRepetition": [
          "07-en-evidence-ledger",
          "12-en-complexity-answerable"
        ],
        "belowUnanimousProfessionalBarCount": 8,
        "hardFailAssets": ["03-ar-automation-relay"],
        "blindOldVsNew": {
          "comparisonScope": "ONE_CONTROLLED_NEUTRAL_LABEL_IDENTICAL_BRIEF",
          "round3CandidateId": "01-ar-context-handoff",
          "winner": "round-three professional rebuild output",
          "decisive": true,
          "supportsSuiteWideOldVsNewConclusion": false
        },
        "approvedGoldenSetCount": 0
      },
      "releaseBlockers": [
        "Eight exact-current-hash critique sets remain below the unanimous professional bar.",
        "The 07/12 dark English conceptual-object shell fails the recent-feed self-repetition gate.",
        "Candidate 03 has a current Arabic typography hard fail and must be rerendered and fully re-reviewed.",
        "The only controlled neutral-label identical-brief comparison covers candidate 01 and does not establish suite-wide old-versus-new superiority.",
        "No exact-hash owner release approval has been recorded.",
        "Live asset-production, originality, feed-review, scheduling, and provider adapters remain unverified."
      ]
    }'::jsonb,
    updated_at = now();

UPDATE workflow_runs
SET status = 'CANCELLED',
    locked_at = NULL,
    locked_by = NULL,
    next_attempt_at = NULL,
    output = COALESCE(output, '{}'::jsonb) || '{
      "creativeQualityMigration": {
        "code": "STALE_POST_PRODUCTION_PIPELINE",
        "reason": "This run predates the durable originality and professional-executor gates.",
        "nextAction": "Re-enqueue through enqueueProfessionalPostProduction after the release gate is explicitly opened."
      }
    }'::jsonb,
    updated_at = now()
WHERE type = 'POST_PRODUCTION'
  AND status IN ('PENDING', 'RUNNING', 'WAITING_FOR_APPROVAL', 'WAITING_FOR_RETRY');
