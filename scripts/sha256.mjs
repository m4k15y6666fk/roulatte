
import crypto from 'node:crypto';

import tar from 'tar';


async function _sha256hashAsync (stream) {
    return await new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');

        hash.once('finish', () => resolve(hash.read().toString('hex')));
        stream.once('error', err => reject(err));

        stream.pipe(hash);
    });
}

async function sha256(dir) {
    const source = tar.create({ gzip: true }, ['./public']);

    return await _sha256hashAsync(source);
}



export default sha256;
