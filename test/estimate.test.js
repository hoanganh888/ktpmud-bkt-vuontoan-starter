'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateEstimate, calculateEstimateScore } = require('../server/estimate');

test('estimate exact value returns exact', () => {
  assert.equal(evaluateEstimate(100, 100, 10).status, 'exact');
});
test('estimate within positive and negative tolerance is distinguished', () => {
  assert.equal(evaluateEstimate(105, 100, 10).status, 'within_above');
  assert.equal(evaluateEstimate(95, 100, 10).status, 'within_below');
});
test('tolerance boundary is inclusive and outside is rejected', () => {
  assert.equal(evaluateEstimate(110, 100, 10).status, 'within_above');
  assert.equal(evaluateEstimate(111, 100, 10).status, 'outside');
});
test('zero answer has one-unit minimum tolerance', () => {
  assert.equal(evaluateEstimate(1, 0, 10).status, 'within_above');
  assert.equal(evaluateEstimate(2, 0, 10).status, 'outside');
});
test('invalid numeric input returns unknown', () => {
  assert.equal(evaluateEstimate('abc', 100, 10).status, 'unknown');
});
test('scoring follows estimate and exact-answer halves', () => {
  assert.equal(calculateEstimateScore(10, 'exact', false), 10);
  assert.equal(calculateEstimateScore(10, 'within_above', true), 10);
  assert.equal(calculateEstimateScore(10, 'within_below', false), 5);
  assert.equal(calculateEstimateScore(10, 'outside', true), 5);
  assert.equal(calculateEstimateScore(10, 'outside', false), 0);
  assert.equal(calculateEstimateScore(10, 'unknown', true), 5);
});

test('invalid tolerance is rejected as unknown', () => {
  assert.equal(evaluateEstimate(100, 100, 101).status, 'unknown');
  assert.equal(evaluateEstimate(100, 100, -1).status, 'unknown');
});
