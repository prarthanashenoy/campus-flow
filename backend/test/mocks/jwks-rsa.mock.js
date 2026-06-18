/**
 * Mock for jwks-rsa to avoid ESM/jose issues in Jest (CommonJS).
 * The strategy is overridden in tests anyway, so this just needs to
 * export a stub that doesn't throw.
 */
module.exports = {
  passportJwtSecret: () => (_header, _payload, done) => done(null, 'test-secret'),
  JwksClient: class {
    getSigningKey(_kid, cb) {
      cb(null, { getPublicKey: () => 'test-key' })
    }
  },
}
