import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createRequireAuth, rateLimit } from '../src/middleware/auth';
import { buildFirebaseWebConfig } from '../src/lib/firebaseConfig';
import { normalizeProjectAnalysis } from '../src/utils/normalizeAnalysis';
import { normalizeHealthReview, parseGeminiJson } from '../src/utils/normalizeHealthReview';
import { generateProjectMarkdown } from '../src/utils/markdownExporter';
import { safeGroundingSources } from '../src/utils/grounding';
import { isRecord, validRecordArray, validString } from '../server';

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
  assert.equal((source.match(/if \(!isRecord\(req\.body\)\)/g) || []).length, 5);
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

test('grounding links reject unsafe URL schemes', () => {
  const sources = safeGroundingSources([
    { title: 'unsafe', url: 'javascript:alert(1)' },
    { title: 'safe', url: 'https://example.com/reference' },
  ]);
  assert.equal(sources.length, 1);
  assert.equal(sources[0].title, 'safe');
});
