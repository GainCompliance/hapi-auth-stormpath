import * as joi from 'joi';
import hoek from 'hoek';
import nJwt from 'njwt';
import Boom from 'boom';

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
      const jwtResponse = request.query.jwtResponse;

      if (!jwtResponse) {
        const jwt = nJwt.create({
          iss: settings.apiKeyId,
          sub: settings.applicationHref,
          cb_uri: settings.returnUrl,
          state: JSON.stringify(request.url.query)
        }, settings.apiKeySecret);

        reply.redirect(`https://api.stormpath.com/sso?jwtRequest=${jwt.compact()}`);
      } else {
        nJwt.verify(jwtResponse, settings.apiKeySecret, (err, verifiedJwt) => {
          if (err) {
            reply(Boom.wrap(err));
          } else if ('AUTHENTICATED' !== verifiedJwt.body.status) {
            reply(Boom.badImplementation(`The ID Site result of "${verifiedJwt.body.status}" was not AUTHENTICATED`));
          } else {
            reply.continue({
              credentials: {
                account: verifiedJwt.body.sub,
                next: JSON.parse(verifiedJwt.body.state).next
              }
            });
          }
        });
      }
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
