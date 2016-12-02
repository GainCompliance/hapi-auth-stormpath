export function register(server, options, next) {
  next();
}

register.attributes = {
  pkg: require('../package.json')
};
