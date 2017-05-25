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
    platform: sinon.stub()
  };
  const loglevelMock = {
    info: sinon.stub(),
    warn: sinon.stub(),
    setLevel: sinon.stub()
  };
  const windowsHelpersMock = {
    isGcloudInstalled: sinon.stub()
  };
  const unixHelpersMock = {
    isGcloudInstalled: sinon.stub(),
    getShellType: sinon.stub()
  };
  const childProcessMock = {
    execSync: sinon.stub().returns(new Buffer.from('verbose')) // eslint-disable-line
  };

  return {
    os: osMock,
    loglevel: loglevelMock,
    windowsHelpers: windowsHelpersMock,
    './helpers-windows': windowsHelpersMock,
    unixHelpers: unixHelpersMock,
    './helpers-unix': unixHelpersMock,
    childProcess: childProcessMock,
    'child_process': childProcessMock
  };
}

test(`should map npm's loglevel to loglevel library constants`, (t) => {
  const mocks = getMocks();

  const lib = proxyquire('../helpers-logging', mocks);
  lib.getLoggerInstance();

  t.true(mocks.childProcess.execSync.calledWith(`npm config get loglevel`));
  t.true(mocks.loglevel.setLevel.calledOnce);
  t.true(mocks.loglevel.setLevel.calledWith(`debug`));
});

test(`should handle an invalid npm loglevel`, (t) => {
  const mocks = getMocks();
  mocks.childProcess.execSync = sinon.stub().returns(new Buffer.from('nyan cat')); // eslint-disable-line

  const lib = proxyquire('../helpers-logging', mocks);
  lib.getLoggerInstance();

  t.true(mocks.childProcess.execSync.calledWith(`npm config get loglevel`));
  t.true(mocks.loglevel.setLevel.calledOnce);
  t.true(mocks.loglevel.setLevel.calledWith(`warn`));
});

test(`should return a stdio configuration based on loglevel`, (t) => {
  const mocks = getMocks();

  const lib = proxyquire('../helpers-logging', mocks);
  t.deepEqual(lib.getStdioConfig(), { stdio: ['inherit', 'inherit', 'inherit'] });
});
