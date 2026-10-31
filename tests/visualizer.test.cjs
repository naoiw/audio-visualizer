const test = require("node:test");
const assert = require("node:assert/strict");
const {
  FFT_SIZE,
  MAX_DISPLAY_FREQUENCY,
  getVisibleBinCount,
  sampleToY,
} = require("./dist/audio/visualizer.js");

test("FFT size stays compatible with Web Audio API", () => {
  assert.equal(FFT_SIZE, 2048);
  assert.equal(MAX_DISPLAY_FREQUENCY, 16000);
});

test("frequency bin count respects sample rate and Nyquist", () => {
  assert.equal(getVisibleBinCount(1024, 48000), 683);
  assert.equal(getVisibleBinCount(1024, 32000), 1024);
  assert.equal(getVisibleBinCount(1024, 8000), 1024);
  assert.equal(getVisibleBinCount(0, 48000), 0);
  assert.equal(getVisibleBinCount(1024, 0), 0);
});

test("time-domain samples map from top to bottom", () => {
  assert.equal(sampleToY(0, 200), 200);
  assert.equal(sampleToY(255, 200), 0);
  assert.equal(sampleToY(128, 200), 200 * (1 - 128 / 255));
  assert.equal(sampleToY(-20, 200), 200);
  assert.equal(sampleToY(300, 200), 0);
});
