// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

// Import required libraries
const test = require(`ava`);
const sinon = require(`sinon`);
const proxyquire = require(`proxyquire`).noPreserveCache();

// Get a new set of mocks
function getMocks () {
  const osMock = {
    platform: sinon.stub().returns('win32')
  };
  const fsMock = {
    writeFile: sinon.stub().yields(),
    existsSync: sinon.stub().returns(true)
  };
  const pathMock = {
    join: sinon.stub().returnsArg(1)
  };

  const envMock = {
    PATH: ';'
  };
  const processMock = {
    env: envMock
  };

  const loglevelMock = {
    info: sinon.stub(),
    error: sinon.stub(),
    debug: sinon.stub()
  };
  const loggingHelpersMock = {
    getLoggerInstance: sinon.stub().returns(loglevelMock)
  };

  const rimrafMock = sinon.stub().yields();
  const requestPromiseMock = sinon.stub().returns(Promise.resolve());
  const childProcessMock = {
    execSync: sinon.stub()
  };
  const extractZipMock = sinon.stub().yields();

  return {
    os: osMock,
    fs: fsMock,
    path: pathMock,
    process: processMock,
    loglevel: loglevelMock,
    rimraf: rimrafMock,
    extractZip: extractZipMock,
    'extract-zip': extractZipMock,
    requestPromise: requestPromiseMock,
    'request-promise': requestPromiseMock,
    childProcess: childProcessMock,
    'child_process': childProcessMock,
    loggingHelpers: loggingHelpersMock,
    './helpers-logging': loggingHelpersMock
  };
}

// Test installation steps
test(`should download zip file for Windows`, async (t) => {
  const mocks = getMocks();

  const lib = proxyquire('../helpers-windows', mocks);
  await lib.installGcloud();

  t.true(mocks.requestPromise.calledOnce);
});

test(`should remove current zip directory`, async (t) => {
  const mocks = getMocks();

  const lib = proxyquire('../helpers-windows', mocks);
  await lib.installGcloud();

  t.true(mocks.rimraf.calledOnce);
  t.true(mocks.rimraf.calledWith(`google-cloud-sdk`));
});

test(`should unzip file`, async (t) => {
  const mocks = getMocks();

  const lib = proxyquire('../helpers-windows', mocks);
  await lib.installGcloud();

  t.true(mocks.extractZip.calledOnce);
  t.true(mocks.extractZip.calledWith('google-cloud-sdk.zip', { dir: 'google-cloud-sdk' }));
});

test(`should run Windows installation script`, async (t) => {
  const mocks = getMocks();

  const lib = proxyquire('../helpers-windows', mocks);
  await lib.installGcloud();

  t.true(mocks.childProcess.execSync.calledWith(`"install.bat" -q`));
});

test(`should add entry to Windows path`, async (t) => {
  const mocks = getMocks();

  const lib = proxyquire('../helpers-windows', mocks);
  await lib.installGcloud();

  t.true(mocks.childProcess.execSync.calledWith(sinon.match(`;bin/`)));
});

// Test error handling
test(`should fail on installation error on Windows systems`, async (t) => {
  const expected = 'installation error';

  const mocks = getMocks();
  mocks['request-promise'] = sinon.stub().returns(Promise.reject(expected));

  const lib = proxyquire('../helpers-windows', mocks);
  await t.throws(lib.installGcloud(), `Fatal: error installing the gcloud SDK: ${expected}`);
});

test(`should warn on path adding error on Windows systems`, async (t) => {
  const expected = 'path adding error';

  const mocks = getMocks();
  mocks.childProcess.execSync = sinon.stub().returnsThis();
  mocks.childProcess.execSync.withArgs(sinon.match(`SetEnvironmentVariable`)).throws(expected);

  const lib = proxyquire('../helpers-windows', mocks);
  await t.notThrows(lib.installGcloud());

  t.true(mocks.loglevel.error.calledWith(`Warning: error adding gcloud SDK to Windows PATH: ${expected}`));
});
