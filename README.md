# Cockpit Composer

[![codecov](https://codecov.io/gh/osbuild/cockpit-composer/branch/main/graph/badge.svg)](https://codecov.io/gh/osbuild/cockpit-composer)

**The web interface for Composer!**

Composer generates custom images suitable for deploying systems or uploading to
the cloud. It integrates into [Cockpit](https://cockpit-project.org/) as a
frontend for [osbuild](https://github.com/osbuild).

## Making changes to Cockpit Composer

Here's where to get the code:

    $ git clone https://github.com/osbuild/cockpit-composer.git
    $ cd cockpit-composer/

The remainder of the commands assume you're in the top level of the
Cockpit Composer git repository checkout.

### Getting the development dependencies

On Fedora or Red Hat Enterprise Linux:

* First install Cockpit on your local machine as described in: https://cockpit-project.org/running.html.
* Next install and start osbuild-composer:
```
    $ sudo yum install osbuild-composer
    $ sudo systemctl start osbuild-composer
```

* Cockpit Composer uses Node.js during development. Node.js is not used at runtime. To make changes on Cockpit you'll want to install Node.js, NPM.
```
    $ sudo yum install nodejs npm
```

In addition, for testing, the following dependencies are required:

    $ sudo dnf install curl expect xz rpm-build chromium-headless \
        libvirt-daemon-kvm libvirt-client python3-libvirt

### Building

Run

    $ make

to build everything. You can only run `make` from the top-level and it will always rebuild the Cockpit Composer.

Cockpit Composer is built using [React](https://reactjs.org/). For inspecting the React component hierarchy, including component props and state, you can run

    $ npm run build:debug

### Running integration test

Run test without visually seeing what the browser is doing:

    $ make check

In the case you wish to visually see what the browser is doing you will want to run:

    $ TEST_SHOW_BROWSER=true make check

or

    $ make debug-check

By default the cockpit-composer will be installed into `$TEST_OS`in [Makefile](Makefile) and test will be run on Chromium. To run it on Firefox, a environment variable ```TEST_BROWSER=firefox``` needs to be added, like:

    $ TEST_BROWSER=firefox make check

To test cockpit-composer in different OS, set the `$TEST_OS` environment variable, for example:

    $ TEST_OS=fedora-33 make check

### Running eslint

Cockpit Composer uses [ESLint](https://eslint.org/) to automatically check
JavaScript code style in `.js` files.

The linter is executed within every build as a webpack preloader.

For developer convenience, the ESLint can be started explicitly by:

    $ npm run eslint

Rules configuration can be found in the `package.json` file.

### Working on your local machine

It's easy to set up your local Linux machine for rapid development of Cockpit Composer's JavaScript code. After building, run this command from your top level Cockpit Composer checkout directory, and make sure to run it as the same user that you'll use to log into Cockpit Composer below.

    $ mkdir -p ~/.local/share/cockpit
    $ ln -s $(pwd)/public/dist ~/.local/share/cockpit/composer

This will cause cockpit to read JavaScript and HTML files directly from the built package output directory instead of using the installed Cockpit UI files.

Now you can log into Cockpit Composer on your local Linux machine at the following address. Use the same user and password that you used to log into your Linux desktop.

https://localhost:9090/composer

After every change to your sources, run `make` to update all the webpacks, and reload cockpit in your browser.

### Directory Layout

```shell
.
├── /components/                # Shared or generic UI components
│   ├── /Layout/                # Website layout component
│   ├── /Link/                  # Link component to be used insted of <a>
│   └── /...                    # etc.
├── /core/                      # Core framework
│   ├── /actions/               # Redux actions
│   ├── /reducers/              # Redux reducers
│   ├── /sagas/                 # Redux saga files
│   ├── /apiCalls.js            # All API calls to lorax-composer
│   ├── /constants.js           # lorax-composer API path
│   ├── /history.js             # Handles client-side navigation
│   ├── /router.js              # Handles routing and data fetching
│   ├── /selectors.js           # Simple “selector” for Redux
│   ├── /store.js               # Application state manager (Redux)
│   └── /utils.js               # Utility for group API URL
├── /data/                      # Provide API for internal use
│   ├── /BlueprintApi.js        # Blueprint API
│   ├── /MetadataApi.js         # Metadata API
│   └── /NotificationsApi.js    # Notification API
├── /node_modules/              # 3rd-party libraries and utilities
├── /pages/                     # React components for web pages
│   ├── /blueprint/             # Blueprint page
│   ├── /blueprints/            # Blueprints page
│   ├── /blueprintEdit/         # Edit blueprint page
│   └── /error/                 # Error page
├── /po/                        # Translated result by Weblate
├── /public/                    # Static files
│   ├── /dist/                  # The folder for compiled output
│   ├── /js/                    # Javascript files included in index.ejs
│   ├── /custom.css             # CSS file included in index.ejs
│   ├── /manifest.json          # manifest file for Cockpit integration
│   └── /index.ejs              # Template for index.html
├── /test/                      # Integration test
├── /utils/                     # Utility and helper classes
│── babel.config.js             # babel configurations
│── cockpit-composer.spec.in    # Cockpit-composer spec file
│── Dockerfile.buildrpm         # Dockerfile for building RPM on Github Actions
│── io.weldr.cockpit-composer.metainfo.xml         # Makes Composer appear on Cockpit's "Applications" page
│── main.js                     # React application entry point
│── Makefile                    # Makefile
│── package.json                # The list of project dependencies and NPM scripts
│── routes.json                 # This list of application routes
│── rpmversion.sh               # Generate the version and release strings for spec file
└── webpack.config.js           # Bundling and optimization settings for Webpack
```

### Cockpit API

To keep Cockpit Composer working with Cockpit API all code should follow the following rules.

 * All urls in the html and javascript need to use relative paths.
 * All requests to the API should be made using ```utils.apiFetch```. Any non API ```fetch``` requests
   must use ```credentials: 'same-origin'``` so that cookies are included with those ajax requests.
 * Use hashes for navigation within the SPA so that cockpit can keep the top level location display
   up to date.

### Package as an RPM/SRPM

This project can be packaged as either a noarch rpm or an srpm.

```shell
$ make rpm                # Or, `make srpm`
```

### i18n

For a general guide on how to write translatable strings, see [weldr.io](http://weldr.io/Translating-welder-web-strings/)

There are a lot of parts involved in translating a string. Here's an overview of the process, from start to finish:

**Step 1**. During development, the developer adds a translatable string. See [weldr.io](http://weldr.io/Translating-welder-web-strings/)
for details on how to indicate that the string is translatable, and what the string may contain. In general, the string
is added using [react-intl](https://github.com/yahoo/react-intl) `MessageDescriptor`s, but without explicit `id` attributes.

*Debugging generated messages*

To see if or how messages are generated, `make po/cockpit-composer.pot` can be run to generate `po/cockpit-composer.pot`,
which is the file, that is uploaded for translators later on.
As part of this process, [babel-plugin-react-intl-auto](https://github.com/akameco/babel-plugin-react-intl-auto)
will add `id` attributes to all of the messages, and [babel-plugin-react-intl](https://github.com/yahoo/babel-plugin-react-intl)
will extract all of the messages to JSON files, written to `./build/messages`. [react-intl-po](https://github.com/evenchange4/react-intl-po) is
used to collect the JSON files into a gettext-style POT file (po/cockpit-composer.pot).

**Step 2**. With `make upload-pot` the PO template gets uploaded to the [Weblate translation platform](https://translate.fedoraproject.org/projects/cockpit-composer/)
where everybody can contribute translations to various languages. This is part of [bots/po-refresh](https://github.com/cockpit-project/bots/blob/main/po-refresh)
which is invoked regularly by [bots/po-trigger](https://github.com/cockpit-project/bots/blob/main/po-trigger).

**Step 3**. Translators provide translations on Weblate.

**Step 4**. With `make download-po` Weblate's translations are downloaded to `po/XX.po`. This is also done by
[bots/po-refresh](https://github.com/cockpit-project/bots/blob/main/po-refresh).

**Step 5**. The user runs cockpit-composer. Based on the user's browser configuration, cockpit-composer determines the user's preferred
language, and if translations are available, these translations are provided to react-intl's `<IntlProvider>`. react-intl
then displays translated strings where possible.

## Making A New Release Of cockpit-composer

When the project is ready for a new release, do the following:

 * Tag the release with `make NEWTAG=X.Y.Z tag`, bumping .Z to the next version unless there are major changes.
 * Edit the commit list to reflect the changes that will be visible to users (it shows up on the GitHub Releases page)
 * Sign the tag with your GPG key

(an editor should open automatically, and gpg is required to be setup in order to sign the tag).

Then push the tag with `git push --tags`. This triggers the [release.yml](.github/workflows/release.yml)
[GitHub action](https://github.com/features/actions) workflow.

The workflow runs [cockpituous](https://github.com/cockpit-project/cockpituous/tree/main/release)
to build a new release of cockpit-composer, with the [cockpituous-release](./utils/cockpituous-release) control file.
This uses the shared [cockpit-project organization secrets](https://github.com/organizations/cockpit-project/settings/secrets).

Finally, import the new `.srpm` into the appropriate RHEL release.

## Automated maintenance

It is important to keep your [NPM modules](./package.json) up to date, to keep
up with security updates and bug fixes. This is done with the
[npm-update bot script](https://github.com/cockpit-project/bots/blob/main/npm-update)
which is run daily or upon [manual request](https://github.com/osbuild/cockpit-composer/actions) through the
[npm-update.yml](.github/workflows/npm-update.yml) [GitHub action](https://github.com/features/actions).

Similarly, translations are refreshed every Tuesday evening (or manually) through the
[po-refresh.yml](.github/workflows/po-refresh.yml) action.

## License

This source code is licensed under the MIT license found in the [`LICENSE.txt`](LICENSE.txt) file.

---
Made with ♥ by the [OSBuild team](https://github.com/orgs/osbuild/people), [Welder team](https://github.com/orgs/weldr/people), [Cockpit team](https://github.com/orgs/cockpit-project/people), and contributors
