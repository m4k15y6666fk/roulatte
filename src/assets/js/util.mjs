
function escape(str = null) {
    if (! str || str.length === 0) {
        console.error('not string');

        return '';
    }

    return str.split('')
                .map(char => char.codePointAt(0))
                .map(code => '&#x' + code.toString(16) + ';')
                .join('');
}


function unescape(str = null) {
    if (! str || str.length === 0) {
        console.error('not string');

        return '';
    }

    return str.replace(/&#x([0-9a-f]+);/g, (_, p1) => {
                    return String.fromCodePoint(parseInt('0x' + p1, 16));
            });
}


function color(j) {
    const i = j % 3;

    if (i === 0) {
        return '#37b0be'
    } else if (i === 1) {
        return '#59c3cf'
    } else if (i === 2) {
        return '#2c8c96'
    }
}



export { escape, unescape, color };
