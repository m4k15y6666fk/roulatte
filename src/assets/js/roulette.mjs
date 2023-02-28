
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


class Cake {
    constructor({
        text = 'ITEM',
        textColor = '#ffffff',
        backgroundColor = '#37b0be',
        visible = true
    } = {}) {

        this.text = text;
        this.textColor = textColor;
        this.backgroundColor = backgroundColor;

        this.visible = visible;

        this._degree = 0;
        this._radian = 0;

        this._isCake = true;
    }


    static isCake(cake) {
        return (cake._isCake === true);
    }


    form(idx) {
        let checked = 'checked';
        let disabled = '';

        if (! this.visible) {
            checked = '';
            disabled = 'disabled';
        }

        let i18n = {
            visibility: 'Visibility',
            title: 'Title',
            text: 'Text',
            background: 'Background',
            remove: 'Remove'
        };
        if (window.location.pathname === '/ja.html') {
            i18n = {
                visibility: '表示',
                title: 'タイトル',
                text: 'テキスト',
                background: '背景',
                remove: '削除'
            }
        }

        return `<h5 class="ui header form-cake-title" data-cake="${idx}">${idx + 1}. ${this.text}</h5>
                <div class="fields">
                    <div class="two wide field">
                      <label>${i18n.visibility}</label>
                      <div class="ui toggle checkbox">
                        <input class="form-cake-visible" data-cake="${idx}" type="checkbox" name="label-${idx}[visible]" ${checked}>
                      </div>
                    </div>
                    <div class="six wide field">
                      <label>${i18n.title}</label>
                      <input class="form-cake-text" data-cake="${idx}" type="text" name="label-${idx}[text]" value="${this.text}" ${disabled}>
                    </div>
                    <div class="three wide field">
                        <label>${i18n.text}</label>
                        <input class="form-cake-color" data-cake="${idx}" type="color" name="label-${idx}[color]" value="${this.textColor}" ${disabled}>
                    </div>
                    <div class="three wide field">
                        <label>${i18n.background}</label>
                        <input class="form-cake-background" data-cake="${idx}" type="color" name="label-${idx}[background]" value="${this.backgroundColor}" ${disabled}>
                    </div>
                    <div class="two wide field">
                        <label>${i18n.remove}</label>
                        <a class="ui red basic icon button form-cake-remove-button ${disabled}" data-cake="${idx}" href="javascript:;">
                            <i class="minus icon"></i>
                        </a>
                    </div>
                </div>`;
    }


    get degree() {
        return this._degree;
    }

    set degree(num) {
        this._degree = parseFloat(num);
        this._radian = parseFloat(num) * Math.PI / 180;
    }


    get radian() {
        return this._radian;
    }

    set radian(num) {
        this._degree = parseFloat(num) * 180 / Math.PI;
        this._radian = parseFloat(num);
    }


    path(idx) {
        return [
            `<rect
                class="svg-cake-background" data-cake="${idx}"
                x="-100" y="-100" width="200" height="200"
                fill="${this.backgroundColor}" stroke="none"
                clip-path="url(#svg-arc)" transform="rotate(${- this.degree} 0 0)" />`,

            `<text
                class="svg-cake-text" data-cake="${idx}"
                x="90" y="0"
                fill="${this.textColor}" stroke="none"
                font-family="Lato, Noto Sans JP" font-size="5" text-anchor="end"
                clip-path="url(#svg-arc)" transform="rotate(${- this.degree} 0 0)">${this.text}</text>`,

            `<rect
                class="svg-cake-blink blink" data-cake="${idx}"
                x="-100" y="-100" width="200" height="200"
                fill="#ffffff" stroke="none"
                clip-path="url(#svg-arc)" transform="rotate(${- this.degree} 0 0)" />`,

        ].join('\n');
    }
}


class Roulette extends Array {
    constructor(...args) {
        super(...args);


        for (const cake of args) {
            if (! Cake.isCake(cake)) {
                throw new Error('not Cake object');

            }
        }

        let i = 0;
        while (i < this.length) {
            this[i].degree = 360 * i / this.length;

            i++;
        }

        this._degree = 360 / this.length;
        this._radian = 2 * Math.PI / this.length;

        this._x = 100 * Math.cos(this._radian / 2);
        this._y = 100 * Math.sin(this._radian / 2);

        this._path = `M 0 0 L ${this._x} ${- this._y} A 100 100 -30 0 1 ${this._x} ${this._y} L 0 0`;
    }


    static init() {
        return new Roulette( ...Array.from({ length: 5 }, (v, i) => new Cake({ text: `ITEM ${ i + 1 }`, backgroundColor: `${ color(i) }` })) );
    }

    static onlyVisible(roulette) {
        let clone = structuredClone(roulette);

        return Roulette.from(clone.filter(cake => cake.visible));
    }

    static toObject(roulette) {
        let clone = structuredClone(roulette);

        return clone.map(({ text, textColor, backgroundColor, visible }) => {
            return { text, textColor, backgroundColor, visible }
        });
    }

    static remove(roulette, idx) {
        let clone = structuredClone(roulette);

        if (clone.length > 2) {
            clone.splice(idx, 1);

            return Roulette.from(clone);

        } else if (clone.length > 0) {
            return roulette;

        } else {
            throw new Error('no cakes');
        }
    }

    static from(array) {
        return new Roulette(
            ...array.map(({ text, textColor, backgroundColor, visible }) => {
                return new Cake({ text, textColor, backgroundColor, visible });
            })
        );
    }


    get degree() {
        return this._degree;
    }

    get radian() {
        return this._radian;
    }


    add() {
        const j = this.length;

        this.push(new Cake({ text: `ITEM ${ j + 1 }`, backgroundColor: `${ color(j) }` }));

        this._x = 100 * Math.cos(Math.PI / this.length);
        this._y = 100 * Math.sin(Math.PI / this.length);
        this._path = `M 0 0 L ${this._x} ${- this._y} A 100 100 -30 0 1 ${this._x} ${this._y} L 0 0`;

        let i = 0;
        while (i < this.length) {
            this[i].degree = 360 * i / this.length;

            i++;
        }
    }

    // remove() {}

    change({ index, text = null, textColor = null, backgroundColor = null }) {
        const idx = Math.abs(parseInt(index));

        if (! text) {
            this[idx].text = text;
        }
        if (! textColor) {
            this[idx].textColor = textColor;
        }
        if (! backgroundColor) {
            this[idx].backgroundColor = backgroundColor;
        }
    }


    updateClipPath(element) {
        while (element.firstChild) {
            element.removeChild( element.firstChild );
        }

        element.insertAdjacentHTML(
            'beforeend',
            `<path d="${this._path}" stroke="none" />`
        );
    }

    updateRoulette(element) {
        while (element.firstChild) {
            element.removeChild( element.firstChild );
        }

        let i = 0;
        while (i < this.length) {
            element.insertAdjacentHTML('beforeend', this[i].path(i));

            i++;
        }
    }

    updateForm(element) {
        while (element.firstChild) {
            element.removeChild( element.firstChild );
        }

        let i = 0;
        while (i < this.length) {
            element.insertAdjacentHTML('beforeend', this[i].form(i));

            i++;
        }
    }
}



export { Cake, Roulette };
