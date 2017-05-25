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

// This file serves as the root script that manages the gcloud SDK installation

// Import required libraries
const childProcess = require('child_process');
const os = require('os');
const loggingHelpers = require('./helpers-logging');

// Get logging constants
const logger = loggingHelpers.getLoggerInstance();
const stdioConfig = loggingHelpers.getStdioConfig();

// Get OS data
const OS_PLATFORM = os.platform();

function main () {
  // Get correct OS-specific helper library
  let osHelpers;
  if (OS_PLATFORM === 'darwin' || OS_PLATFORM === 'linux') {
    osHelpers = require('./helpers-unix');
  } else if (OS_PLATFORM === 'win32') {
    osHelpers = require('./helpers-windows');
  } else {
    // Unsupported platform
    throw new Error('This platform is not supported.\nPlease install gcloud manually.');
  }

  // Install/update gcloud using the appropriate helper library
  if (osHelpers.isGcloudInstalled()) {
    updateGcloud();
  } else {
    osHelpers.installGcloud();
  }
}

// Updates gcloud on all platforms
function updateGcloud () {
  logger.info('Updating existing gcloud installation...');
  childProcess.execSync('gcloud components update --quiet', stdioConfig);
}

main();
