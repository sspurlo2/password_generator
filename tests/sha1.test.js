const mod = require('../extension/src/sha1');
const sha1 = typeof mod === 'function' ? mod : (mod.default || mod.sha1 || mod);

function testSHA1() {
  const testCases = [
    {msg: '', expected: 'da39a3ee5e6b4b0d3255bfef95601890afd80709'},
    {msg: 'abc', expected: 'a9993e364706816aba3e25717850c26c9cd0d89d'},
    {msg: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq', expected: '84983e441c3bd26ebaae4aa1f95129e5e54670f1'}
  ];

  for (const c of testCases) {
    const got = sha1(c.msg);
    if (got !== c.expected) {
      console.log('FAIL', JSON.stringify(c.msg), '->', got);
      return false;
    }
  }

  return true;
}

const result = testSHA1();
console.log("All tests passed:", result);

module.exports = result;