import joi from 'joi';
import hoek from 'hoek';
import nJwt from 'njwt';

function validate(options) {
  const validated = joi.validate(options, joi.object({
    applicationHref: joi.string().uri().required(),
    apiKeyId: joi.string().required(),
    apiKeySecret: joi.string().required(),
    returnUrl: joi.string().uri().required()
  }).required());

  hoek.assert(!validated.error, validated.error);

  return validated.value;
}

export function scheme(server, options) {
  const settings = validate(options);

  return {
    authenticate(request, reply) {
      const jwt = nJwt.create({
        iss: settings.apiKeyId,
        sub: settings.applicationHref,
        cb_uri: settings.returnUrl
      }, settings.apiKeySecret);

      reply.redirect(`https://api.stormpath.com/sso?jwtRequest=${jwt.compact()}`);
    }
  };
}

export function register(server, options, next) {
  server.auth.scheme('stormpath', scheme);

  next();
}

register.attributes = {
  pkg: require('../package.json')
};
