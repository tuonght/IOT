import test from "node:test";
import assert from "node:assert/strict";
import { ALERT_DURATION_MS, isDeviceAlertActive } from "../src/utils/deviceAlerts.js";

const measuredAt = "2026-10-28T15:00:00";
const receivedAt = Date.parse(`${measuredAt}+07:00`);
const rule = { active: true, measuredAt };

test("a high sample expires exactly after five seconds", () => {
  assert.equal(ALERT_DURATION_MS, 5000);
  assert.equal(isDeviceAlertActive(rule, receivedAt), true);
  assert.equal(isDeviceAlertActive(rule, receivedAt + 4999), true);
  assert.equal(isDeviceAlertActive(rule, receivedAt + 5000), false);
});

test("polling an old sample does not renew the warning", () => {
  assert.equal(isDeviceAlertActive({ ...rule }, receivedAt + 10000), false);
  assert.equal(isDeviceAlertActive({ ...rule }, receivedAt + 60000), false);
});

test("a new high sample renews the five-second window", () => {
  const next = { active: true, measuredAt: "2026-10-28T15:00:05" };
  assert.equal(isDeviceAlertActive(rule, receivedAt + 5000), false);
  assert.equal(isDeviceAlertActive(next, receivedAt + 5000), true);
  assert.equal(isDeviceAlertActive(next, receivedAt + 10000), false);
});

test("normal or malformed samples never blink", () => {
  assert.equal(isDeviceAlertActive({ ...rule, active: false }, receivedAt), false);
  assert.equal(isDeviceAlertActive({ active: true }, receivedAt), false);
  assert.equal(isDeviceAlertActive({ active: true, measuredAt: "invalid" }, receivedAt), false);
});
