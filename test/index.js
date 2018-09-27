const expect = require('chai').expect;

describe.skip('my thing', function () {
  it('should work', function () {
    expect(true).to.be.true;
    throw new Error('unimplemented');
  });
});
