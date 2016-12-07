import {assert} from 'chai';
import sinon from 'sinon';
import any from '@travi/any';
import nJwt from 'njwt';
import Boom from 'boom';
import pkg from '../../package.json';
import {register, scheme} from '../../src/scheme';

suite('stormpath scheme', () => {
  let sandbox;

  setup(() => {
    sandbox = sinon.sandbox.create();
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

  // suite('options validation', () => {
  //   test('that an error is thrown if no options are provided', () => {
  //     assert.throws(() => scheme(), '"value" is required');
  //   });
  //
  //   test('that an error is thrown if the application href is not provided', () => {
  //     assert.throws(() => scheme(null, {}), 'child "applicationHref" fails because ["applicationHref" is required]');
  //   });
  //
  //   test('that an error is thrown if the application href is not a url', () => {
  //     assert.throws(() => scheme(null, {
  //       applicationHref: any.string()
  //     }), 'child "applicationHref" fails because ["applicationHref" must be a valid uri]');
  //   });
  //
  //   test('that an error is thrown if the api key id is not provided', () => {
  //     assert.throws(() => scheme(null, {
  //       applicationHref: any.url()
  //     }), 'child "apiKeyId" fails because ["apiKeyId" is required]');
  //   });
  //
  //   test('that an error is thrown if the api key secret is not provided', () => {
  //     assert.throws(() => scheme(null, {
  //       applicationHref: any.url(),
  //       apiKeyId: any.string()
  //     }), 'child "apiKeySecret" fails because ["apiKeySecret" is required]');
  //   });
  //
  //   test('that an error is thrown if the return url is not provided', () => {
  //     assert.throws(() => scheme(null, {
  //       applicationHref: any.url(),
  //       apiKeyId: any.string(),
  //       apiKeySecret: any.string()
  //     }), 'child "returnUrl" fails because ["returnUrl" is required]');
  //   });
  //
  //   test('that an error is thrown if the application href is not a url', () => {
  //     assert.throws(() => scheme(null, {
  //       applicationHref: any.url(),
  //       apiKeyId: any.string(),
  //       apiKeySecret: any.string(),
  //       returnUrl: any.string()
  //     }), 'child "returnUrl" fails because ["returnUrl" must be a valid uri]');
  //   });
  // });

  suite('direct user to ID Site', () => {
    setup(() => sandbox.stub(nJwt, 'create'));

    test('that the request is redirected to ID Site', () => {
      const redirect = sinon.spy();
      const cont = sinon.spy();
      const compact = sinon.stub();
      const compactedJwt = any.word();
      const next = any.string();
      const options = {
        applicationHref: any.url(),
        apiKeyId: any.string(),
        apiKeySecret: any.string(),
        returnUrl: any.url()
      };
      nJwt.create.withArgs({
        iss: options.apiKeyId,
        sub: options.applicationHref,
        cb_uri: options.returnUrl,
        state: JSON.stringify({next})
      }, options.apiKeySecret).returns({compact});
      compact.returns(compactedJwt);

      scheme(null, options).authenticate({query: {}, url: {query: {next}}}, {redirect, continue: cont});

      assert.calledWith(redirect, `https://api.stormpath.com/sso?jwtRequest=${compactedJwt}`);
      assert.notCalled(cont);
    });
  });

  suite('handle ID Site result', () => {
    const options = {
      applicationHref: any.url(),
      apiKeyId: any.string(),
      apiKeySecret: any.string(),
      returnUrl: any.url()
    };

    setup(() => {
      sandbox.stub(nJwt, 'verify');
      sandbox.stub(Boom, 'wrap');
      sandbox.stub(Boom, 'badImplementation');
    });

    test('that the account reference and next are extracted from the response jwt', () => {
      const redirect = sinon.spy();
      const cont = sinon.spy();
      const jwtResponse = any.word();
      const subject = any.url();
      const next = any.string();
      nJwt.verify.withArgs(jwtResponse, options.apiKeySecret).yields(null, {body: {
        sub: subject,
        status: 'AUTHENTICATED',
        state: JSON.stringify({next})
      }});

      scheme(null, options).authenticate({query: {jwtResponse}}, {redirect, continue: cont});

      assert.calledWith(cont, {credentials: {account: subject, next}});
      assert.notCalled(redirect);
    });

    test('that a jwt verification error results in an error response', () => {
      const jwtResponse = any.word();
      const reply = sinon.spy();
      const error = new Error();
      const wrappedError = new Error('wrapped');
      Boom.wrap.withArgs(error).returns(wrappedError);
      nJwt.verify.withArgs(jwtResponse, options.apiKeySecret).yields(error);

      scheme(null, options).authenticate({query: {jwtResponse}}, reply);

      assert.calledWith(reply, wrappedError);
    });

    test('that a status that is not AUTHENTICATED results in an error', () => {
      const jwtResponse = any.word();
      const reply = sinon.spy();
      const error = any.simpleObject();
      const status = 'REGISTERED';
      Boom.badImplementation.withArgs(`The ID Site result of "${status}" was not AUTHENTICATED`).returns(error);
      nJwt.verify.withArgs(jwtResponse, options.apiKeySecret).yields(null, {body: {status}});

      scheme(null, options).authenticate({query: {jwtResponse}}, reply);

      assert.calledWith(reply, error);
    });
  });
});
