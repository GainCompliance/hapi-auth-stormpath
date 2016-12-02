import {assert} from 'chai';
import sinon from 'sinon';
import any from '@travi/any';
import nJwt from 'njwt';
import pkg from '../../package.json';
import {register, scheme} from '../../src/scheme';

suite('stormpath scheme', () => {
  let sandbox;

  setup(() => {
    sandbox = sinon.sandbox.create();

    sandbox.stub(nJwt, 'create');
  });

  teardown(() => sandbox.restore());

  test('that the plugin is defined', () => {
    assert.deepEqual(register.attributes, {pkg});
  });

  test('that an authentication scheme is registered for stormpath', () => {
    const next = sinon.spy();
    const schemeSpy = sinon.spy();

    register({auth: {scheme: schemeSpy}}, null, next);

    assert.calledWith(schemeSpy, 'stormpath', scheme);
    assert.calledOnce(next);
  });

  test('that the request is redirected to ID Site', () => {
    const redirect = sinon.spy();
    const compact = sinon.stub();
    const compactedJwt = any.word();
    const options = {
      applicationHref: any.url(),
      apiKeyId: any.string(),
      apiKeySecret: any.string(),
      returnUrl: any.url()
    };
    nJwt.create.withArgs({
      iss: options.apiKeyId,
      sub: options.applicationHref,
      cb_uri: options.returnUrl
    }, options.apiKeySecret).returns({compact});
    compact.returns(compactedJwt);

    scheme(null, options).authenticate(null, {redirect});

    assert.calledWith(redirect, `https://api.stormpath.com/sso?jwtRequest=${compactedJwt}`);
  });
});
