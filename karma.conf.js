'use strict'

// The last command line argument.
const mode = (process.env.hasOwnProperty('BUILD_MODE') ? process.env.BUILD_MODE : 'dev').toLowerCase()

// Karma configuration
// Generated on Thu Nov 12 2015 07:04:29 GMT-0600 (CST)
require && require('localenvironment')

var _browser
var caniuse
var lb
var useDistributionFiles = null
var reporterEngines = ['spec']
var customLaunchers = {}
var browsers = ['chrome']
var sauceConfiguration = {
  testName: 'NGN Chassis Mixins Unit Tests',
  build: process.env.SEMAPHORE_BUILD_NUMBER || 1,
  recordVideo: false,
  recordScreenshots: false
}

switch (mode) {
  case 'live':
    console.warn('Running a live developer test.')
    useDistributionFiles = false
  case 'prod': // eslint-disable-line no-fallthrough
    console.warn('Running production test.')
    useDistributionFiles = typeof useDistributionFiles === 'boolean' ? useDistributionFiles : true

    // Latest Browsers
    caniuse = require('caniuse-api')
    lb = caniuse.getLatestStableBrowsers()

    console.info('Latest Stable Browsers:')

    browsers.push('firefox')

    lb.forEach(function (item) {
      item = item.split(' ')
      var browser = item[0]
      var version = item[1]
      var willtest = false

      // Sauce labs continually fails when testing the "latest" Firefox, so rollback a version.
      if (browser === 'firefox') {
        version -= 1
      }

      if (browsers.indexOf(browser) >= 0 ||
        !useDistributionFiles && browser === 'edge' ||
        (useDistributionFiles && ['edge', 'ie', 'safari'].indexOf(browser) >= 0)) {
        willtest = true
      }

      console.info('  - ' + browser + ':', version + (willtest ? ' ---> WILL BE TESTED' : ''))

      if (browsers.indexOf(browser) >= 0) {
        version = version - 1
        customLaunchers['cl_chrome_' + version.toString()] = {
          base: 'SauceLabs',
          browserName: browser,
          version: version
        }
      }
    })

    if (useDistributionFiles) {
      console.log('\nAlso testing:')

      console.log('  - safari 8')
      customLaunchers.cl_safari_8 = {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.10',
        version: '8'
      }

      customLaunchers.cl_safari_9 = {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.11',
        version: '9'
      }

      // console.log('  - IE 10')
      // customLaunchers.cl_ie_10 = {
      //   base: 'SauceLabs',
      //   browserName: 'internet explorer',
      //   platform: 'Windows 8',
      //   version: '10'
      // }

      customLaunchers.cl_ie_11 = {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 10',
        version: '11'
      }
    }

    customLaunchers.cl_edge_20 = {
      base: 'SauceLabs',
      browserName: 'microsoftedge',
      platform: 'Windows 10',
      version: '20.10240'
    }

    sauceConfiguration.tunnelIdentifier = process.env.SEMAPHORE_PROJECT_HASH_ID
    sauceConfiguration.username = process.env.SAUCE_USERNAME
    sauceConfiguration.accessKey = process.env.SAUCE_ACCESS_KEY
    sauceConfiguration.startConnect = true
    sauceConfiguration.connectOptions = {
      port: 5757,
      logfile: 'sauce_connect.log',
      logger: function (message) {
        console.log('[SAUCECONNECT]', message)
      }
    }

    reporterEngines.unshift('saucelabs')

    break

  default:
    useDistributionFiles = false
    // dev mode
    _browser = 'Chrome'
    if (process.argv.indexOf('--firefox') >= 0) {
      _browser = 'Firefox'
    }

    if (process.argv.indexOf('--safari') >= 0) {
      _browser = 'Safari'
    }
    break
}

var getFiles = function () {
  var files

  if (useDistributionFiles) {
    files = [
      'dist/chassis.mixins.debug.js'
    ]
  } else {
    files = require('fs').readdirSync(require('path').resolve('./src')).filter(function (filename) {
      return filename !== 'core.js'
    })
    files.unshift('core.js')
    files = files.map(function (filename) {
      return 'src/' + filename
    })
  }

  return files.concat([
    'test/*.js',
    'test/test.html'
  ])
}

module.exports = function (config) {
  // If a distribution is required, make it.
  if (useDistributionFiles) {
    const cp = require('child_process')
    console.info('\nBuilding distribution files.\n')
    cp.execSync('gulp build')
    setTimeout(function () {
      console.info('Distribution ready.')
    }, 2000)
  }

  config.set({
    browserDisconnectTimeout: 120000,
    browserDisconnectTolerance: 10,
    browserNoActivityTimeout: 120000,

    specReporter: {
      maxLogLines: 5,         // limit number of lines logged per test
      suppressErrorSummary: mode !== 'dev',  // do not print error summary
      suppressFailed: false,  // do not print information about failed tests
      suppressPassed: true,  // do not print information about passed tests
      suppressSkipped: true,  // do not print information about skipped tests
      showSpecTiming: false // print the time elapsed for each spec
    },

    sauceLabs: sauceConfiguration,

    customLaunchers: customLaunchers,

    plugins: [
      require('karma-browserify'),
      require('tape'),
      require('karma-tap'),
      require('karma-spec-reporter'),
      require('karma-chrome-launcher'),
      require('karma-phantomjs-launcher'),
      require('karma-sauce-launcher'),
      require('karma-html2js-preprocessor')
    ],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['tap', 'browserify'],

    // expressServer: {
    //   port: 9877,
    //   extensions: [
    //     function (app, logger) {
    //       app.get('/test', function (req, res, next) {
    //         logger.info('/test hit')
    //         res.send('ok')
    //       })
    //     }
    //   ]
    // },

    // list of files / patterns to load in the browser
    files: getFiles(),

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/*.js': [ 'browserify' ],
      'test/test.html': 'html2js'
    },

    browserify: {
      debug: true
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: reporterEngines,

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: mode === 'dev' ? config.LOG_DEBUG : config.LOG_WARN,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: mode === 'dev' ? [_browser] : Object.keys(customLaunchers),
    // ['Chrome', 'Firefox', 'Safari', 'Opera', 'IE'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browsers should be started simultanous
    concurrency: 3
  })
}
