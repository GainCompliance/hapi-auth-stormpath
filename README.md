# hapi-auth-stormpath

Stormpath authentication plugin for hapi

[![No Maintenance Intended](http://unmaintained.tech/badge.svg)](http://unmaintained.tech/)
The [Stormpath](https://stormpath.com/) service has been [shut down](https://stormpath.com/blog/stormpaths-new-path),
so this plugin no longer provides value.

[![npm](https://img.shields.io/npm/v/@gaincompliance/hapi-auth-stormpath.svg?maxAge=2592000)](https://www.npmjs.com/package/@gaincompliance/hapi-auth-stormpath)
[![license](https://img.shields.io/github/license/GainCompliance/hapi-auth-stormpath.svg)](LICENSE)

[![Build Status](https://img.shields.io/travis/GainCompliance/hapi-auth-stormpath/master.svg?style=flat)](https://travis-ci.org/GainCompliance/hapi-auth-stormpath)
[![Codecov](https://img.shields.io/codecov/c/github/GainCompliance/hapi-auth-stormpath.svg)](https://codecov.io/github/GainCompliance/hapi-auth-stormpath)

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
![greenkeeper badge](https://badges.greenkeeper.io/GainCompliance/hapi-auth-stormpath.svg)



## Installation
```
$ npm install @gaincompliance/hapi-auth-stormpath -S
```

## Usage

Include this plugin in the [manifest](https://github.com/hapijs/glue) of your hapi application to make the
[Stormpath](https://stormpath.com/) authentication scheme available to your application. When registered for a route,
a user will be directed to Stormpath's [ID Site](https://docs.stormpath.com/rest/product-guide/latest/idsite.html) for
your registered application to authenticate.

Once the scheme has been registered, register a [strategy](http://hapijs.com/tutorials/auth#strategies) that uses the
`stormpath` scheme provided by this plugin.

### Configuration

When registering the strategy, be sure to provide the following required
configuration:

 * `apiKeyId` (_required_) - the api key ID for your Stormpath application
 * `apiKeySecret` (_required_) - the api key secret from your Stormpath application
 * `applicationHref` (_required_) - the url that identifies your application according to the Stormpath API
 * `returnUrl` (_required_) - the fully qualified url that ID Site should send the user back to after authentication

 ### Example

```js
export function register(server, options, next) {
  server.auth.strategy('stormpath', 'stormpath', {
    apiKeyId: process.env.SP_API_KEY_ID,
    apiKeySecret: process.env.SP_API_KEY_SECRET,
    applicationHref: `https://api.stormpath.com/v1/applications/${process.env.STORMPATH_APPLICATION_ID}`,
    returnUrl: 'https://your.site.com/login'
  });

  next();
}

register.attributes = {
  name: 'authentication-strategy'
};
```
