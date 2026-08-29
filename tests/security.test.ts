import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createRequireAuth, rateLimit } from '../src/middleware/auth';
import { buildFirebaseWebConfig } from '../src/lib/firebaseConfig';
import { normalizeProjectAnalysis } from '../src/utils/normalizeAnalysis';
import { normalizeHealthReview, parseGeminiJson } from '../src/utils/normalizeHealthReview';
import { generateProjectMarkdown } from '../src/utils/markdownExporter';
import { safeGroundingSources } from '../src/utils/grounding';
import {
  classifyGeminiError,
  configuredGeminiModels,
  getGeminiApiKey,
  isRecord,
  validateChatRequest,
  validProjectContext,
  validRecordArray,
  validString,
} from '../server';

function responseRecorder() {
  const state: { status?: number; body?: unknown; headers: Record<string, unknown> } = { headers: {} };
  const response = {
    status(code: number) { state.status = code; return response; },
    json(body: unknown) { state.body = body; return response; },
    setHeader(name: string, value: unknown) { state.headers[name] = value; return response; }
  };
  return { state, response: response as any };
}

test('missing and malformed Authorization headers return 401', async () => {
  const middleware = createRequireAuth(async () => ({ uid: 'unused' } as any));
  for (const authorization of [undefined, 'Basic abc', 'Bearer ']) {
    const { state, response } = responseRecorder();
    await middleware({ headers: { authorization } } as any, response, () => assert.fail('next called'));
    assert.equal(state.status, 401);
  }
});

test('invalid Firebase token returns 401 without exposing verifier details', async () => {
  const middleware = createRequireAuth(async () => { throw Object.assign(new Error('sensitive detail'), { code: 'auth/invalid-token' }); });
  const { state, response } = responseRecorder();
  await middleware({ headers: { authorization: 'Bearer invalid' } } as any, response, () => assert.fail('next called'));
  assert.equal(state.status, 401);
  assert.doesNotMatch(JSON.stringify(state.body), /sensitive detail/);
});

test('expired Firebase token returns 401', async () => {
  const middleware = createRequireAuth(async () => {
    throw Object.assign(new Error('token expired at a sensitive timestamp'), { code: 'auth/id-token-expired' });
  });
  const { state, response } = responseRecorder();
  await middleware({ headers: { authorization: 'Bearer expired' } } as any, response, () => assert.fail('next called'));
  assert.equal(state.status, 401);
  assert.doesNotMatch(JSON.stringify(state.body), /sensitive timestamp/);
});

test('authenticated request reaches the next handler', async () => {
  const middleware = createRequireAuth(async () => ({ uid: 'user-1' } as any));
  const { response } = responseRecorder();
  let reached = false;
  const request: any = { headers: { authorization: 'Bearer valid' } };
  await middleware(request, response, () => { reached = true; });
  assert.equal(reached, true);
  assert.equal(request.user.uid, 'user-1');
});

test('rate limiter returns 429 after the configured allowance', () => {
  const limiter = rateLimit({ windowMs: 60_000, maxRequests: 2 });
  const request: any = { user: { uid: 'rate-test-user' } };
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { state, response } = responseRecorder();
    limiter(request, response, () => {});
    if (attempt === 3) assert.equal(state.status, 429);
  }
});

test('request validation rejects malformed shapes and oversized arrays', () => {
  assert.equal(isRecord([]), false);
  assert.equal(validString('', 10, true), false);
  assert.equal(validString('x'.repeat(11), 10), false);
  assert.equal(validRecordArray([{}, {}], 1), false);
  assert.equal(validRecordArray([{ title: 'ok' }], 1), true);
});

test('missing Firebase configuration fails clearly without exposing values', () => {
  assert.throws(() => buildFirebaseWebConfig({}), /Missing Firebase configuration/);
});

test('Gemini routes do not return raw internal error messages', async () => {
  const source = await readFile(new URL('../server.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /res\.status\(500\)[\s\S]{0,120}error\?\.message/);
  assert.match(source, /reportEndpointError\('analyze-project'/);
  assert.match(source, /reportEndpointError\('suggest-tasks'/);
});

test('all Gemini routes require auth, rate limiting, and validation', async () => {
  const source = await readFile(new URL('../server.ts', import.meta.url), 'utf8');
  const routes = ['analyze-project', 'chat', 'research', 'health-assessment', 'suggest-tasks'];
  for (const route of routes) {
    assert.match(source, new RegExp(`app\\.post\\('/api/gemini/${route}', requireAuth, geminiRateLimiter`));
  }
  assert.match(source, /validateChatRequest\(req\.body\)/);
});

test('Gemini prompts retain explicit untrusted-data boundaries', async () => {
  const source = await readFile(new URL('../server.ts', import.meta.url), 'utf8');
  for (const boundary of ['UNTRUSTED_PROJECT_DATA', 'UNTRUSTED_USER_QUERY', 'UNTRUSTED_RESEARCH_QUERY']) {
    assert.match(source, new RegExp(`<${boundary}>`));
    assert.match(source, new RegExp(`</${boundary}>`));
  }
});

test('Firestore rules preserve authenticated owner isolation', async () => {
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
  assert.match(rules, /request\.auth\s*!=\s*null/);
  assert.match(rules, /request\.auth\.uid\s*==\s*userId/);
  assert.doesNotMatch(rules, /allow\s+(read|write)\s*:\s*if\s+true/);
  assert.match(rules, /request\.resource\.data\.uid\s*==\s*userId/);
  assert.match(rules, /request\.resource\.data\.uid\s*==\s*resource\.data\.uid/);
});

test('Gemini analysis normalizes snake_case and supplies defaults', () => {
  const normalized = normalizeProjectAnalysis({
    problem_definition: 'A defined problem',
    proposed_solution: 'A safe solution',
    key_objectives: ['Ship safely'],
    suggested_tech_stack: { front_end: 'React', ai_ml: 'Gemini' },
    major_risks: [{ threat: 'Abuse', level: 'high', countermeasure: 'Rate limit' }],
  });
  assert.equal(normalized.problemDefinition, 'A defined problem');
  assert.equal(normalized.suggestedTechStack.frontend, 'React');
  assert.equal(normalized.majorRisks[0].severity, 'HIGH');
  assert.ok(normalized.functionalRequirements.length > 0);
});

test('markdown-wrapped health JSON is parsed and normalized safely', () => {
  const parsed = parseGeminiJson('```json\n{"health_score":140,"overall_status":"on track"}\n```');
  const normalized = normalizeHealthReview(parsed);
  assert.equal(normalized.score, 100);
  assert.equal(normalized.overallStatus, 'GOOD');
  assert.ok(normalized.areas?.security?.summary);
});

test('malformed Gemini analysis receives complete safe defaults', () => {
  const normalized = normalizeProjectAnalysis(undefined);
  assert.ok(normalized.problemDefinition);
  assert.ok(normalized.dataRequirements.length > 0);
  assert.ok(normalized.securityConsiderations.length > 0);
  assert.ok(normalized.suggestedFirstActions.length > 0);
});

test('Markdown export redacts credential-shaped content', () => {
  const markdown = generateProjectMarkdown({
    id: 'p1', uid: 'u1', name: 'Example', shortDescription: 'GEMINI_API_KEY=not-a-real-secret-value',
    createdAt: Date.now(), updatedAt: Date.now(),
  });
  assert.match(markdown, /GEMINI_API_KEY=\[REDACTED\]/);
  assert.doesNotMatch(markdown, /not-a-real-secret-value/);
});

test('production persistence and synthetic guest fallbacks are development-gated', async () => {
  const firestoreSource = await readFile(new URL('../src/services/firestoreService.ts', import.meta.url), 'utf8');
  const authSource = await readFile(new URL('../src/context/AuthContext.tsx', import.meta.url), 'utf8');
  assert.match(firestoreSource, /if \(!import\.meta\.env\.DEV\)/);
  assert.match(authSource, /import\.meta\.env\.DEV.*projectpilot_guest_active/);
});

test('frontend bootstrap dynamically loads Firebase-dependent application code and renders failures', async () => {
  const source = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8');
  assert.match(source, /import\('\.\/App\.tsx'\)/);
  assert.match(source, /Application initialization failed/);
  assert.match(source, /ProjectPilot configuration error/);
});

test('grounding links reject unsafe URL schemes', () => {
  const sources = safeGroundingSources([
    { title: 'unsafe', url: 'javascript:alert(1)' },
    { title: 'safe', url: 'https://example.com/reference' },
  ]);
  assert.equal(sources.length, 1);
  assert.equal(sources[0].title, 'safe');
});

test('chat validation accepts optional context and bounded history', () => {
  const base = { message: 'Help with this project' };
  assert.equal(validateChatRequest(base), null);
  assert.match(validateChatRequest({ ...base, projectContext: {} }) || '', /malformed/i);
  assert.equal(validateChatRequest({ ...base, projectContext: { name: 'Project' }, conversationHistory: [] }), null);
  assert.equal(validateChatRequest({
    ...base,
    projectContext: {
      name: 'Project', shortDescription: 'Description', analysis: { keyObjectives: ['Ship'], suggestedTechStack: { frontend: 'React' } },
      recentNotes: [{ title: 'Note', content: 'Content' }],
      decisions: [{ decision: 'Use Firebase', reasoning: 'Realtime', status: 'ACCEPTED' }],
      experiments: [{ name: 'Load test', hypothesis: 'Fast', result: 'Pass' }],
    },
    conversationHistory: Array.from({ length: 10 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: `Message ${index}` })),
  }), null);
});

test('project context accepts minimal, complete, and missing optional fields', () => {
  assert.equal(validProjectContext({ name: 'Minimal project' }), true);
  assert.equal(validProjectContext({ name: 'Pending analysis', analysis: null }), true);
  assert.equal(validProjectContext({
    name: 'Complete project',
    shortDescription: 'A complete context',
    problemBeingSolved: 'A real problem',
    currentPhase: 'BUILD',
    tasksSummary: { total: 4, completed: 1, inProgress: 1, todo: 2 },
    analysis: {
      keyObjectives: ['Ship safely'],
      suggestedTechStack: { frontend: 'React', backend: 'Express', other: ['Firebase'] },
    },
    recentNotes: [{ title: 'Note', content: 'Content' }],
    decisions: [{ decision: 'Use Firebase', reasoning: 'Owner isolation', status: 'ACCEPTED' }],
    experiments: [{ name: 'Load test', hypothesis: 'Fast enough', result: 'Pending' }],
  }), true);
});

test('project context rejects missing required fields and invalid or oversized fields', () => {
  assert.equal(validProjectContext({}), false);
  assert.equal(validProjectContext({ name: '' }), false);
  assert.equal(validProjectContext({ name: 42 }), false);
  assert.equal(validProjectContext({ name: 'x'.repeat(151) }), false);
  assert.equal(validProjectContext({ name: 'Project', shortDescription: 'x'.repeat(501) }), false);
  assert.equal(validProjectContext({ name: 'Project', tasksSummary: { total: -1 } }), false);
});

test('project context rejects malformed nested objects without weakening optional fields', () => {
  assert.equal(validProjectContext({ name: 'Project', analysis: [] }), false);
  assert.equal(validProjectContext({ name: 'Project', analysis: { keyObjectives: [42] } }), false);
  assert.equal(validProjectContext({ name: 'Project', analysis: { suggestedTechStack: { frontend: { unsafe: true } } } }), false);
  assert.equal(validProjectContext({ name: 'Project', recentNotes: [{ title: 42, content: 'Content' }] }), false);
  assert.equal(validProjectContext({ name: 'Project', decisions: [{}] }), false);
  assert.equal(validProjectContext({ name: 'Project', experiments: 'not-an-array' }), false);
});

test('chat validation rejects malformed and oversized history', () => {
  const message = 'Help';
  assert.match(validateChatRequest({ message, conversationHistory: Array.from({ length: 11 }, () => ({ role: 'user', content: 'x' })) }) || '', /malformed/i);
  assert.match(validateChatRequest({ message, conversationHistory: [{ role: 'system', content: 'x' }] }) || '', /history/i);
  assert.match(validateChatRequest({ message, conversationHistory: [{ role: 'user', content: 42 }] }) || '', /history/i);
  assert.match(validateChatRequest({ message, conversationHistory: [{ role: 'user', content: 'x'.repeat(2001) }] }) || '', /history/i);
  assert.match(validateChatRequest({ message, projectContext: false }) || '', /malformed/i);
});

test('Gemini configuration uses one verified default and explicit fallbacks only', () => {
  assert.deepEqual(configuredGeminiModels({} as NodeJS.ProcessEnv), ['gemini-3.7-flash']);
  assert.deepEqual(configuredGeminiModels({ GEMINI_MODEL: 'primary', GEMINI_FALLBACK_MODELS: 'fallback,primary' } as NodeJS.ProcessEnv), ['primary', 'fallback']);
  assert.throws(() => getGeminiApiKey({} as NodeJS.ProcessEnv), /not configured/i);
  assert.equal(getGeminiApiKey({ GEMINI_API_KEY: 'configured-placeholder' } as NodeJS.ProcessEnv), 'configured-placeholder');
});

test('Gemini HTTP failures are categorized without raw provider details', () => {
  assert.equal(classifyGeminiError({ status: 400, message: 'raw' }).category, 'INVALID_REQUEST');
  assert.equal(classifyGeminiError({ status: 401 }).category, 'AUTH_FAILED');
  assert.equal(classifyGeminiError({ status: 403 }).category, 'AUTH_FAILED');
  assert.equal(classifyGeminiError({ status: 404 }).category, 'MODEL_UNAVAILABLE');
  assert.equal(classifyGeminiError({ status: 429 }).category, 'RATE_LIMITED');
  assert.equal(classifyGeminiError({ status: 503 }).category, 'SERVICE_UNAVAILABLE');
  assert.equal(classifyGeminiError(new Error('internal detail')).category, 'INTERNAL_ERROR');
  assert.throws(() => parseGeminiJson('not-json'));
});

test('Cloud Build passes every required Firebase build argument without server secrets', async () => {
  const config = await readFile(new URL('../cloudbuild.yaml', import.meta.url), 'utf8');
  for (const name of [
    'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID', 'VITE_FIREBASE_DATABASE_ID',
  ]) {
    assert.match(config, new RegExp(`${name}=\\$\\{_${name}\\}`));
  }
  assert.doesNotMatch(config, /GEMINI_API_KEY/);
  assert.doesNotMatch(config, /VITE_FIREBASE_MEASUREMENT_ID/);
});
