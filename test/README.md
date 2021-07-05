# Cockpit-Composer Integration Test

The integration test for Cockpit Composer! It is performed on the
application level and tests whether the business requirements are met
regardless of app internal architecture, dependencies, data integrity and such.
Actually we need to follow the end-user flows and assert they get the intended
experience and focus on the behavior of the thing as the user would see it.

The integration tests are powered by [Cockpit test
framework](https://github.com/cockpit-project/cockpit/tree/main/test), which is simple and easy to
debug for test development.

## Requirement

For testing, the following dependencies are required:

    $ sudo dnf install curl expect xz rpm-build chromium-headless \
        libvirt-daemon-kvm libvirt-client python3-libvirt

And `chrome-remote-interface` and `sizzle` Javascript libraries need to be installed:

    $ npm install

## Introduction

Before running the tests, ensure Cockpit-Composer environment has been built:

    $ make vm

To run all tests run the following:

    $ make check

Alternatively, you can run individual tests. To list the individual test names you can run:

    $ test/common/run-tests --test-dir=test/verify -l

And then run:

    $ test/common/run-tests --test-dir=test/verify $TEST_NAME

To run the tests with network, use the `--enable-network` flag:

    $ test/common/run-tests --test-dir=test/verify --enable-network $TEST_NAME

To see more verbose output from the test, use the `--verbose` and/or `--trace` flags:

    $ test/common/run-tests --test-dir=test/verify --verbose --trace $TEST_NAME

In addition if you specify `--sit`, then the test will wait on failure and allow you to log into
cockpit and/or the test instance and diagnose the issue. An address will be printed of the test
instance.

    $ test/common/run-tests --test-dir=test/verify --sit $TEST_NAME

Normally each test starts its own chromium headless browser process on a separate random port. To
interactively follow what a test is doing, set environment variable `$TEST_SHOW_BROWSER`.

    $ TEST_SHOW_BROWSER=true test/common/run-tests --test-dir=test/verify $TEST_NAME

## Test Configuration

You can set these environment variables to configure the test suite:

    TEST_OS    The OS to run the tests in.  Currently supported values:
                  "fedora-33, fedora-34, rhel-8-4"
               "fedora-33" is the default

    TEST_DATA  Where to find and store test machine images.  The
               default is the same directory that this README file is in.

    TEST_CDP_PORT  Attach to an actually running browser that is compatible with
                   the Chrome Debug Protocol, on the given port. Don't use this
                   with parallel tests.

    TEST_BROWSER  What browser should be used for testing. Currently supported values:
                     "chromium"
                     "firefox"
                  "chromium" is the default.

    TEST_SHOW_BROWSER  Set to run browser interactively. When not specified,
                       browser is run in headless mode.

## Guidelines for writing tests

Tests decorated with `@nondestructive` will all run against the same test
machine. The nondestructive test should clean up after itself and restore the
state of the machine, such that the next nondestructive test is not impacted.

A fast running test suite is more important than independent,
small test cases.

## Code coverage from end-to-end tests

Before running the tests the application code must be instrumented with
istanbul! Then inside the browser scope all coverage information is available
from `window.__coverage__` which needs to be passed back to the node scope
and made available for the reporting tools to use.

Please include helper method `check_coverage()` at the end of each test.
This helper method will collect coverage result and save result into file
`.nyc_output/coverage-<HASH>.json`. The hash value is the sha256 sum of
the coverage report itself. Some cases may have identical coverage so
the number of json files will be equal or less to the number of test cases.

## Code Style

Python code in this project should follow
[Flake8](https://www.flake8rules.com/).
