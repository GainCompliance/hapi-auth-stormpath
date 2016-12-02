import {assert} from 'chai';
import pkg from '../../package.json';
import {register} from '../../src/scheme';

suite('stormpath scheme', () => {
  test('that the plugin is defined', () => {
    assert.deepEqual(register.attributes, {pkg});
  });
});
