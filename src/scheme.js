import nJwt from 'njwt';
import Boom from 'boom';

export function scheme(server, options) {
  return {
    authenticate(request, reply) {
      const jwtResponse = request.query.jwtResponse;

      if (!jwtResponse) {
        const jwt = nJwt.create({
          iss: options.apiKeyId,
          sub: options.applicationHref,
          cb_uri: options.returnUrl,
          state: JSON.stringify(request.url.query)
        }, options.apiKeySecret);

        reply.redirect(`https://api.stormpath.com/sso?jwtRequest=${jwt.compact()}`);
      } else {
        nJwt.verify(jwtResponse, options.apiKeySecret, (err, verifiedJwt) => {
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
