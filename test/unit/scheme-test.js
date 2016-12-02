import {assert} from 'chai';
import sinon from 'sinon';
import pkg from '../../package.json';
import {register} from '../../src/scheme';

suite('stormpath scheme', () => {
  test('that the plugin is defined', () => {
    assert.deepEqual(register.attributes, {pkg});
  });

  test('that an authentication scheme is registered for stormpath', () => {
    const next = sinon.spy();

    register(null, null, next);

    assert.calledOnce(next);
  });
});
