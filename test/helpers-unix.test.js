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

// This file contains unit tests for the gcloud-cli npm package

// Import required libraries
const test = require(`ava`);
const sinon = require(`sinon`);
const proxyquire = require(`proxyquire`).noPreserveCache();

// Get a new set of mocks
function getMocks () {
  const osMock = {
    platform: sinon.stub().returns('linux')
  };
  const pathMock = {
    join: sinon.stub().returnsArg(1)
  };

  const envMock = {
    HOME: '~',
    SHELL: '/zsh'
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

  const unixHelpersMock = {
    isGcloudInstalled: sinon.stub(),
    getShellType: sinon.stub()
  };
  const childProcessMock = {
    execSync: sinon.stub()
  };

  return {
    os: osMock,
    path: pathMock,
    process: processMock,
    loglevel: loglevelMock,
    unixHelpers: unixHelpersMock,
    './helpers-unix': unixHelpersMock,
    childProcess: childProcessMock,
    'child_process': childProcessMock,
    loggingHelpers: loggingHelpersMock,
    './helpers-logging': loggingHelpersMock
  };
}

// Test shell detection
test(`should detect shell type on UNIX and add an entry to *shrc`, (t) => {
  const mocks = getMocks();
  mocks.process.env.SHELL = '/zsh';

  const lib = proxyquire('../helpers-unix', mocks);
  lib.installGcloud();

  t.true(mocks.childProcess.execSync.calledWith(
    `echo "\n\n# gcloud sdk\nsource path.zsh.inc" >> .zshrc`
  ));
});

test(`should handle invalid shell type on UNIX`, (t) => {
  const mocks = getMocks();
  mocks.process.env.SHELL = '/invalid-shell';

  const lib = proxyquire('../helpers-unix', mocks);
  lib.installGcloud();

  t.false(mocks.childProcess.execSync.calledWith(
    `echo "\n\n# gcloud sdk\nsource path.zsh.inc" >> .zshrc`
  ));
});

// Test error handling
test(`should fail on installation error on UNIX systems`, async (t) => {
  const expected = 'installation error';

  const mocks = getMocks();
  mocks.childProcess.execSync = sinon.stub().throws(expected);

  const lib = proxyquire('../helpers-unix', mocks);
  await t.throws(lib.installGcloud(), `Fatal: error installing gcloud SDK: ${expected}`);
});

test(`should warn on path adding error on UNIX systems`, async (t) => {
  const expected = 'path adding error';

  const mocks = getMocks();
  mocks.childProcess.execSync = sinon.stub().returnsThis();
  mocks.childProcess.execSync.withArgs(sinon.match(`# gcloud sdk`)).throws(expected);

  const lib = proxyquire('../helpers-unix', mocks);
  await t.notThrows(lib.installGcloud());

  t.true(mocks.loglevel.error.calledWith(`Warning: error adding gcloud SDK alias to shell: ${expected}`));
});
