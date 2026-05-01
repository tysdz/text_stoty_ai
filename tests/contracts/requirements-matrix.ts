export type RequirementPriority = 'P0' | 'P1' | 'P2'

export type RequirementCoverageEntry = {
  id: string
  feature: string
  userValue: string
  risk: string
  priority: RequirementPriority
  tests: ReadonlyArray<string>
}

export const REQUIREMENTS_MATRIX: ReadonlyArray<RequirementCoverageEntry> = [
  {
    id: 'REQ-ASSETHUB-CHARACTER-EDIT',
    feature: 'Asset Hub character edit',
    userValue: 'localized text',
    risk: 'localized text',
    priority: 'P0',
    tests: [
      'tests/integration/api/contract/crud-routes.test.ts',
      'tests/integration/chain/text.chain.test.ts',
    ],
  },
  {
    id: 'REQ-ASSETHUB-REFERENCE-TO-CHARACTER',
    feature: 'Asset Hub reference-to-character',
    userValue: 'localized text',
    risk: 'referenceImages localized text',
    priority: 'P0',
    tests: [
      'tests/unit/helpers/reference-to-character-helpers.test.ts',
      'tests/unit/worker/reference-to-character.test.ts',
      'tests/integration/chain/text.chain.test.ts',
    ],
  },
  {
    id: 'REQ-NP-GENERATE-IMAGE',
    feature: 'Novel promotion image generation',
    userValue: 'Character/Location/localized text',
    risk: 'localized text payload localized text、worker localized text',
    priority: 'P0',
    tests: [
      'tests/integration/api/contract/direct-submit-routes.test.ts',
      'tests/unit/worker/image-task-handlers-core.test.ts',
      'tests/integration/chain/image.chain.test.ts',
      'tests/system/generate-image.system.test.ts',
    ],
  },
  {
    id: 'REQ-NP-GENERATE-VIDEO',
    feature: 'Novel promotion video generation',
    userValue: 'localized text',
    risk: 'panel localized text、model localized text、localized text',
    priority: 'P0',
    tests: [
      'tests/integration/api/contract/direct-submit-routes.test.ts',
      'tests/unit/worker/video-worker.test.ts',
      'tests/integration/chain/video.chain.test.ts',
      'tests/system/generate-video.system.test.ts',
    ],
  },
  {
    id: 'REQ-NP-INSERT-PANEL-AUTO-ANALYZE',
    feature: 'Novel promotion insert panel',
    userValue: 'AI localized text',
    risk: 'route localized text worker localized text',
    priority: 'P0',
    tests: [
      'tests/unit/novel-promotion/insert-panel-user-input.test.ts',
      'tests/integration/api/contract/direct-submit-routes.test.ts',
      'tests/system/text-workflow.system.test.ts',
    ],
  },
  {
    id: 'REQ-NP-PANEL-VARIANT-SAFETY',
    feature: 'Novel promotion panel variant',
    userValue: 'localized text storyboard，localized text，localized text',
    risk: 'localized text、localized text panel、localized text',
    priority: 'P0',
    tests: [
      'tests/integration/api/specific/panel-variant-route.test.ts',
      'tests/integration/api/contract/direct-submit-routes.test.ts',
      'tests/unit/worker/panel-variant-task-handler.test.ts',
      'tests/regression/panel-variant-cross-storyboard.test.ts',
    ],
  },
  {
    id: 'REQ-NP-TEXT-ANALYSIS',
    feature: 'Text analysis and storyboard orchestration',
    userValue: 'localized text',
    risk: 'step localized text',
    priority: 'P1',
    tests: [
      'tests/integration/api/contract/llm-observe-routes.test.ts',
      'tests/unit/worker/script-to-storyboard.test.ts',
      'tests/integration/chain/text.chain.test.ts',
      'tests/system/text-workflow.system.test.ts',
    ],
  },
  {
    id: 'REQ-TASK-STATE-CONSISTENCY',
    feature: 'Task state and SSE consistency',
    userValue: 'localized text',
    risk: 'target-state localized text SSE localized text',
    priority: 'P0',
    tests: [
      'tests/unit/helpers/task-state-service.test.ts',
      'tests/integration/api/contract/task-infra-routes.test.ts',
      'tests/integration/task/create-task-dedupe.integration.test.ts',
      'tests/unit/optimistic/sse-invalidation.test.ts',
    ],
  },
  {
    id: 'REQ-PROVIDER-PROTOCOL-CONTRACT',
    feature: 'Provider protocol contract',
    userValue: 'localized text provider localized text、localized text',
    risk: 'provider localized text',
    priority: 'P0',
    tests: [
      'tests/integration/provider/fal-provider.contract.test.ts',
      'tests/integration/provider/openai-compat-provider.contract.test.ts',
      'tests/unit/task/async-poll-external-id.test.ts',
    ],
  },
  {
    id: 'REQ-TASK-DEDUPE-COMPENSATION',
    feature: 'Task dedupe and enqueue compensation',
    userValue: 'localized text，localized text',
    risk: 'localized text、localized text dedupeKey、enqueue localized text',
    priority: 'P0',
    tests: [
      'tests/integration/task/create-task-dedupe.integration.test.ts',
      'tests/integration/billing/submitter.integration.test.ts',
      'tests/regression/task-dedupe-recovery.test.ts',
      'tests/regression/task-enqueue-billing-rollback.test.ts',
      'tests/unit/worker/user-concurrency-gate.test.ts',
    ],
  },
  {
    id: 'REQ-API-CONFIG-TUTORIAL-PORTAL',
    feature: 'API config tutorial modal layering',
    userValue: 'localized text，localized text provider card',
    risk: 'localized text，localized text',
    priority: 'P1',
    tests: [
      'tests/unit/api-config/provider-card-tutorial-modal.test.ts',
    ],
  },
  {
    id: 'REQ-INFRA-PUBLIC-ROUTES',
    feature: 'Infra and public routes',
    userValue: 'localized text，localized text',
    risk: 'localized text，localized text、localized text',
    priority: 'P1',
    tests: [
      'tests/integration/api/contract/infra-routes.test.ts',
    ],
  },
]
