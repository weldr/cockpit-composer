import json
import hashlib
import os
import pathlib

import parent
import testlib

# starting osbuild-composer.socket with no permission user will cause error[0-8]
allowed_journal_messages = [
    "http:///run/weldr/api.socket/api/v0/.* couldn't connect: Could not connect: Connection refused",
    "polkit-agent-helper-1: pam_authenticate failed: Authentication failure",
    "We trust you have received the usual lecture from the local System",
    "Administrator. It usually boils down to these three things:",
    ".*Respect the privacy of others.*",
    ".*Think before you type.*",
    ".*With great power comes great responsibility.*",
    ".*Sorry, try again.*",
    ".*sudo: 3 incorrect password attempts.*",
]
# starting osbuild-composer.socket with no permission user will cause error[0]
allowed_browser_errors = [
    ".*Failed to start osbuild-composer.socket.*Not permitted to perform this action.*",
]


class ComposerCase(testlib.MachineCase):
    def setUp(self):
        super().setUp(restrict=False)

        self.allow_journal_messages(*allowed_journal_messages)
        self.allow_browser_errors(*allowed_browser_errors)

        # no timeout for image building
        self.machine.write("/etc/cockpit/cockpit.conf", "[Session]\nIdleTimeout=0\n")

        # re-start osbuild-composer.socket
        self.machine.execute(script="""#!/bin/sh
        systemctl stop --quiet osbuild-composer.socket osbuild-composer.service osbuild-local-worker.socket
        systemctl start osbuild-composer.socket
        """)

        # push pre-defined blueprint
        self.machine.execute(script="""#!/bin/sh
        systemctl start osbuild-composer.socket
        for toml_file in /home/admin/files/*.toml; do
            composer-cli blueprints push $toml_file
        done
        composer-cli blueprints list
        """)

        # delete all blueprints
        self.addCleanup(self.machine.execute,
                        "for bp in $(composer-cli blueprints list); "
                        "do composer-cli blueprints delete $bp; done")

    # Hack to add more wait time to work with aarch64 platform test
    def login_and_go(self, *args, **kwargs):
        with self.browser.wait_timeout(300):
            super().login_and_go(*args, **kwargs)

    def check_coverage(self):
        """ collect code coverage result and save to json file

        Save coverage as json file and make file hash as file name
        "coverage-<file hash result>.json", to avoid duplicate coverage result.
        All json file will be saved to ".nyc_output/" folder.
        """
        coverage_data = self.browser.eval_js("window.__coverage__", no_trace=True)
        str_coverage = json.dumps(coverage_data)
        hash_str = hashlib.sha256(str_coverage.encode('utf-8')).hexdigest()

        cov_out_dir = pathlib.Path(".nyc_output")
        cov_out_dir.mkdir(exist_ok=True)

        cov_out_file = cov_out_dir / "coverage-{}.json".format(hash_str)
        # avoid duplecate result file
        if not cov_out_file.is_file():
            cov_out_file.write_text(str_coverage)
