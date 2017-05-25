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
    info: sinon.stub()
  };
  const windowsHelpersMock = {
    isGcloudInstalled: sinon.stub()
  };
  const unixHelpersMock = {
    isGcloudInstalled: sinon.stub(),
    installGcloud: sinon.stub(),
    getShellType: sinon.stub()
  };
  const childProcessMock = {
    execSync: sinon.stub()
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

// Test OS detection
test('should detect Windows correctly', (t) => {
  const mocks = getMocks();
  mocks.os.platform = sinon.stub().returns('win32');
  mocks.windowsHelpers.isGcloudInstalled = sinon.stub().returns(true);

  proxyquire('../main', mocks);

  t.true(mocks.windowsHelpers.isGcloudInstalled.calledOnce);
  t.false(mocks.unixHelpers.isGcloudInstalled.called);
});

test('should detect OSX correctly', (t) => {
  const mocks = getMocks();
  mocks.os.platform = sinon.stub().returns('darwin');
  mocks.unixHelpers.isGcloudInstalled = sinon.stub().returns(true);

  proxyquire('../main', mocks);

  t.true(mocks.unixHelpers.isGcloudInstalled.calledOnce);
  t.false(mocks.windowsHelpers.isGcloudInstalled.called);
});

test('should detect Linux correctly', (t) => {
  const mocks = getMocks();
  mocks.os.platform = sinon.stub().returns('linux');
  mocks.unixHelpers.isGcloudInstalled = sinon.stub().returns(true);

  proxyquire('../main', mocks);

  t.true(mocks.unixHelpers.isGcloudInstalled.calledOnce);
  t.false(mocks.windowsHelpers.isGcloudInstalled.called);
});

test('should detect unsupported OSes correctly', (t) => {
  const mocks = getMocks();
  mocks.os.platform = sinon.stub().returns('unsupported-os');

  t.throws(() => { proxyquire('../main', mocks); },
    'This platform is not supported.\nPlease install gcloud manually.'
  );

  t.false(mocks.windowsHelpers.isGcloudInstalled.called);
  t.false(mocks.unixHelpers.isGcloudInstalled.called);
});

// Test existing installation detection/handling
test('should update gcloud, if gcloud is already installed', (t) => {
  const mocks = getMocks();
  mocks.os.platform = sinon.stub().returns('linux');
  mocks.unixHelpers.isGcloudInstalled = sinon.stub().returns(true);

  proxyquire('../main', mocks);
  t.true(mocks.unixHelpers.isGcloudInstalled.calledOnce);
  t.false(mocks.unixHelpers.installGcloud.called);
  t.true(mocks.childProcess.execSync.calledWith('gcloud components update --quiet'));
});

test(`should install gcloud, if it's not present`, (t) => {
  const mocks = getMocks();
  mocks.os.platform = sinon.stub().returns('linux');
  mocks.unixHelpers.isGcloudInstalled = sinon.stub().returns(false);

  proxyquire('../main', mocks);
  t.true(mocks.unixHelpers.isGcloudInstalled.calledOnce);
  t.true(mocks.unixHelpers.installGcloud.called);
});
