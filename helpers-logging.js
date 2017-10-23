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

// This file contains logging helpers for "npm install gcloud-cli"

// Import required libraries
const childProcess = require('child_process');

// Get constants
const NPM_LOGLEVEL = childProcess.execSync(`npm config get loglevel`).toString().trim();

// Helper function to get stdio config (for childProcess.execSync) as a function of npm log level
// @returns a dictionary compatible with childProcess.execSync's "stdio" parameter
function getStdioConfig () {
  let stdioConfig = { stdio: ['inherit', 'inherit', 'inherit'] };
  if (NPM_LOGLEVEL === 'silent') {
    stdioConfig = { stdio: ['ignore', 'ignore', 'ignore'] };
  }
  if (NPM_LOGLEVEL === 'warn') {
    stdioConfig = { stdio: ['ignore', 'ignore', process.stderr] };
  }
  return stdioConfig;
}

// Helper function to return a logger instance
function getLoggerInstance () {
  const logger = require('loglevel');
  const loglevelMap = {
    silly: 'trace',
    verbose: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error',
    silent: 'silent'
  };
  const LOGGER_LOGLEVEL = loglevelMap[NPM_LOGLEVEL];
  if (LOGGER_LOGLEVEL) {
    logger.setLevel(LOGGER_LOGLEVEL);
  } else {
    logger.setLevel('warn');
    logger.warn(`npm log level '${NPM_LOGLEVEL}' is unsupported; using default of 'warn'`);
  }
  return logger;
}

// Exports
module.exports = {
  getLoggerInstance: getLoggerInstance,
  getStdioConfig: getStdioConfig
};
