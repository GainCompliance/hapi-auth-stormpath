import nJwt from 'njwt';

export function scheme(server, options) {
  return {
    authenticate(request, reply) {
      const jwt = nJwt.create({
        iss: options.apiKeyId,
        sub: options.applicationHref,
        cb_uri: options.returnUrl
      }, options.apiKeySecret);

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
