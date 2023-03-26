/* cSpell:disable */

/*
----
MD5 implementation in apps script
https://gist.github.com/KEINOS/78cc23f37e55e848905fc4224483763d
----
*/

/**
 * turn a string into an MD5 hash
 *
 * @param {(string|Bytes[])} input  The value to hash.
 * @param {boolean} isShortMode     Set true for 4 digit shortend hash, else returns usual MD5 hash.
 * @return {string}                 The hashed input value.
 * @customfunction
 */
function MD5(input, isShortMode) {
    var isShortMode = !!isShortMode; // Ensure to be bool for undefined type
    var txtHash = "";
    var rawHash = Utilities.computeDigest(
        Utilities.DigestAlgorithm.MD5,
        input,
        Utilities.Charset.UTF_8 // Multibyte encoding env compatibility
    );

    if (!isShortMode) {
        for (i = 0; i < rawHash.length; i++) {
            var hashVal = rawHash[i];

            if (hashVal < 0) {
                hashVal += 256;
            }
            if (hashVal.toString(16).length == 1) {
                txtHash += "0";
            }
            txtHash += hashVal.toString(16);
        }
    } else {
        for (j = 0; j < 16; j += 8) {
            hashVal =
                (rawHash[j] + rawHash[j + 1] + rawHash[j + 2] + rawHash[j + 3]) ^ (rawHash[j + 4] + rawHash[j + 5] + rawHash[j + 6] + rawHash[j + 7]);

            if (hashVal < 0) {
                hashVal += 1024;
            }
            if (hashVal.toString(36).length == 1) {
                txtHash += "0";
            }

            txtHash += hashVal.toString(36);
        }
    }

    // change below to "txtHash.toUpperCase()" if needed
    return txtHash;
}
