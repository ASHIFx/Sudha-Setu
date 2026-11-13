import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import KnowledgeBase from '../src/models/KnowledgeBase.js';
import Ambulance from '../src/models/Ambulance.js';
import Dispatch from '../src/models/Dispatch.js';
import CaseSheet from '../src/models/CaseSheet.js';
import Hospital from '../src/models/Hospital.js';
import { analyzeSymptoms, statusForAssessment } from '../src/services/triageEngine.js';
import { generateAccessToken, generateRefreshToken } from '../src/utils/jwt.js';
import { verifyAccessToken } from '../src/config/jwt.js';
import { createDispatch, listDispatches, updateDispatchStatus, findNearestHospital } from '../src/controllers/ambulanceController.js';
import { normalizeIntakeData } from '../src/services/intakeExtractor.js';
import { validateAuthInput } from '../src/middlewares/authInput.js';
import { resetPassword } from '../src/controllers/authController.js';
import User from '../src/models/User.js';
import Otp from '../src/models/Otp.js';

process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';
delete process.env.GEMINI_API_KEY;
const id = () => new mongoose.Types.ObjectId();
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const fail = (err) => { throw err; };

test('refresh tokens cannot authenticate API or socket requests', () => {
  const userId = id();
  assert.equal(verifyAccessToken(generateAccessToken(userId, 'patient')).sub, String(userId));
  assert.throws(() => verifyAccessToken(generateRefreshToken(userId)));
});

test('unknown symptoms are sent to a doctor when AI is unavailable', async (t) => {
  t.mock.method(KnowledgeBase, 'find', () => ({ lean: async () => [] }));
  const result = await analyzeSymptoms('unrecognized description in any language');
  assert.equal(result.requiresHumanReview, true);
  assert.equal(result.verifiedAdvice, null);
  assert.equal(statusForAssessment(result), 'pending_doctor');
});

test('emergency guard runs before mild rules and AI', async (t) => {
  t.mock.method(KnowledgeBase, 'find', () => { throw new Error('Must not need database lookup'); });
  const result = await analyzeSymptoms('Mild headache with chest pain');
  assert.equal(result.dangerLevel, 'high');
  assert.equal(statusForAssessment(result), 'emergency_alerted');
});

test('keyword matching respects word boundaries, negation and repeated symptoms', async (t) => {
  t.mock.method(KnowledgeBase, 'find', () => ({ lean: async () => [{
    _id: id(), keywordTriggers: ['pain'], dangerClassification: 'medium', verifiedAdvice: {},
  }] }));
  assert.equal((await analyzeSymptoms('normally pain after dinner')).reason, 'rule_matched');
  assert.equal((await analyzeSymptoms('no pain but pain returned')).reason, 'rule_matched');
  assert.equal((await analyzeSymptoms('no pain')).reason, 'clinical_fallback');
  assert.equal((await analyzeSymptoms('painting the house')).reason, 'clinical_fallback');
});

test('human review overrides low risk and high confidence', () => {
  assert.equal(statusForAssessment({ dangerLevel: 'low', confidenceScore: 0.99, verifiedAdvice: {}, requiresHumanReview: true }), 'pending_doctor');
});

test('greetings do not query the clinical database', async (t) => {
  t.mock.method(KnowledgeBase, 'find', () => { throw new Error('Unexpected query'); });
  assert.equal((await analyzeSymptoms('Hello')).isGreeting, true);
});

test('a patient cannot dispatch another patient’s case', async (t) => {
  t.mock.method(CaseSheet, 'findById', async () => ({ patientId: id(), dangerLevel: 'high' }));
  const res = response();
  await createDispatch({ body: { caseId: String(id()) }, user: { _id: id(), role: 'patient' } }, res, fail);
  assert.equal(res.statusCode, 403);
});

test('a repeated SOS returns the existing dispatch without reserving a second unit', async (t) => {
  const patientId = id();
  const existing = { _id: id(), ambulanceId: id() };
  t.mock.method(CaseSheet, 'findById', async () => ({ patientId, dangerLevel: 'high' }));
  t.mock.method(Dispatch, 'findOne', async () => existing);
  t.mock.method(Ambulance, 'findById', async () => ({}));
  t.mock.method(Ambulance, 'findOneAndUpdate', () => { throw new Error('Duplicate reservation'); });
  const res = response();
  await createDispatch({ body: { caseId: String(id()) }, user: { _id: patientId, role: 'patient' } }, res, fail);
  assert.equal(res.body.dispatch, existing);
});

test('busy ambulances are never reassigned', async (t) => {
  t.mock.method(CaseSheet, 'findById', async () => ({ patientId: id(), dangerLevel: 'high' }));
  t.mock.method(Dispatch, 'findOne', async () => null);
  t.mock.method(Hospital, 'find', async () => []);
  t.mock.method(Ambulance, 'findOneAndUpdate', async (filter) => {
    assert.equal(filter.status, 'available');
    return null;
  });
  const res = response();
  await createDispatch({ body: { caseId: String(id()) }, user: { role: 'admin' } }, res, fail);
  assert.equal(res.statusCode, 409);
});

test('ambulance crews cannot update another crew’s dispatch', async (t) => {
  t.mock.method(Dispatch, 'findById', async () => ({ ambulanceId: id(), status: 'dispatched' }));
  t.mock.method(Ambulance, 'findOne', async () => ({ _id: id() }));
  const res = response();
  await updateDispatchStatus({ params: { id: String(id()) }, body: { status: 'accepted' }, user: { _id: id(), role: 'ambulance' } }, res, fail);
  assert.equal(res.statusCode, 403);
});

test('completed dispatches cannot be reopened', async (t) => {
  t.mock.method(Dispatch, 'findById', async () => ({ status: 'completed' }));
  const res = response();
  await updateDispatchStatus({ params: { id: String(id()) }, body: { status: 'dispatched' }, user: { role: 'admin' } }, res, fail);
  assert.equal(res.statusCode, 409);
});

test('crews without a profile cannot read all dispatches', async (t) => {
  t.mock.method(Ambulance, 'findOne', async () => null);
  const res = response();
  await listDispatches({ query: {}, user: { _id: id(), role: 'ambulance' } }, res, fail);
  assert.equal(res.statusCode, 403);
});

test('only a crew’s own dispatches are listed', async (t) => {
  const profileId = id();
  t.mock.method(Ambulance, 'findOne', async () => ({ _id: profileId }));
  t.mock.method(Dispatch, 'find', (filter) => {
    assert.equal(filter.ambulanceId, profileId);
    assert.equal(filter.$or, undefined);
    const query = { populate() { return this; }, async sort() { return []; } };
    return query;
  });
  const res = response();
  await listDispatches({ query: {}, user: { _id: id(), role: 'ambulance' } }, res, fail);
  assert.deepEqual(res.body.dispatches, []);
});

test('hospital lookup never substitutes a non-emergency facility', async (t) => {
  t.mock.method(Hospital, 'find', async (filter) => {
    assert.equal(filter.emergencyCapable, true);
    return [];
  });
  assert.equal(await findNearestHospital({ lat: 28, lng: 77 }), null);
});

test('malformed AI extraction cannot block a case with invalid enum or severity values', () => {
  const data = normalizeIntakeData({ symptoms: [null, { name: ' ', severity: 5 }, { name: 'pain', severity: 99, duration: {} }], ayurvedicMarkers: { suspectedPrakriti: 'invented', agniStatus: [], sleepPattern: {} } });
  assert.deepEqual(data.symptoms, [{ name: 'pain' }]);
  assert.deepEqual(data.ayurvedicMarkers, { suspectedPrakriti: 'unknown', agniStatus: 'unknown' });
  assert.deepEqual(normalizeIntakeData(null).symptoms, []);
});

test('object-valued credentials are rejected before database queries', () => {
  const res = response();
  validateAuthInput({ body: { email: { $ne: null } } }, res, () => assert.fail('Must reject object'));
  assert.equal(res.statusCode, 400);
});

test('invalid replacement passwords do not consume the reset code', async (t) => {
  t.mock.method(User, 'findOne', async () => ({ save: async () => { const error = new Error('Too short'); error.name = 'ValidationError'; error.errors = {}; throw error; } }));
  t.mock.method(Otp, 'findOne', async () => ({ _id: id() }));
  t.mock.method(Otp, 'deleteOne', () => assert.fail('A failed password change must preserve the code'));
  const res = response();
  await resetPassword({ body: { email: 'a@example.com', code: '123456', newPassword: 'short' } }, res, fail);
  assert.equal(res.statusCode, 400);
});

test('failed dispatch creation releases the reserved vehicle', async (t) => {
  const ambulanceId = id();
  t.mock.method(CaseSheet, 'findById', async () => ({ _id: id(), dangerLevel: 'high' }));
  t.mock.method(Dispatch, 'findOne', async () => null);
  t.mock.method(Hospital, 'find', async () => []);
  t.mock.method(Ambulance, 'findOneAndUpdate', async () => ({ _id: ambulanceId }));
  t.mock.method(Dispatch, 'create', async () => { const error = new Error('Duplicate'); error.code = 11000; throw error; });
  const release = t.mock.method(Ambulance, 'updateOne', async (filter, update) => {
    assert.equal(filter._id, ambulanceId);
    assert.equal(update.$set.status, 'available');
  });
  const res = response();
  await createDispatch({ body: { caseId: String(id()) }, user: { role: 'admin' } }, res, fail);
  assert.equal(res.statusCode, 409);
  assert.equal(release.mock.callCount(), 1);
});
