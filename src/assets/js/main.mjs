
import { escape } from './util.mjs';

import { openIDB, Settings } from './db.mjs';
import RouletteStorage from './db-extra.mjs';

import { Cake, Roulette } from './roulette.mjs';



let db = await openIDB();
let settings = new Settings(db);
RouletteStorage.init(db);



let id;
try {
    id = await settings.get('CurrentID');

    if (! id) {
        throw new Error('no id');
    }

    if (! await RouletteStorage.isCorrectID(id)) {
        id = await RouletteStorage.getFirstID(true);
        await settings.set('CurrentID', id);
    }

} catch(err) {
    console.error(err);

    id = 1;
    await settings.set('CurrentID', id);
}


let template;
try {
    template = await RouletteStorage.getTemplate(id);

    if (! template) {
        throw new Error('no template');
    }

} catch(err) {
    console.error(err);

    console.log(id);

    await RouletteStorage.addFirstTemplate();
    template = await RouletteStorage.getTemplate(id);
}

console.log(template);


template.roulette = Roulette.from(template.roulette);
//console.log(template);


$('.ui.checkbox').checkbox();



const form_select_template = document.querySelector('#form-template-name-select');

async function initFormSelect() {
    let select = document.querySelector('#form-template-name-select');

    while (select.firstChild) {
        select.removeChild( select.firstChild );
    }

    const dest = new WritableStream({
        write(chunk, controller) {
            const option = document.createElement('option');
            option.value = chunk.id;
            option.textContent = chunk.name;

            select.appendChild(option);
        },
        close(controller) {
            if ($) {
                $('.ui.dropdown').dropdown({ allowAdditions: true });
                $('.ui.dropdown').dropdown('refresh');
            }
        }
    });

    return await RouletteStorage.getAllTemplates().pipeTo(dest);
}
await initFormSelect();
$('#form-template-name-select').dropdown('set selected', id);
if (await RouletteStorage.countTemplates() <= 1) {
    form_select_template.dispatchEvent(new Event('change'));
}



const form_input_template = document.querySelector('#form-template-name-input');
form_input_template.value = template.name;



let visibles = Roulette.onlyVisible(template.roulette);


const form_template_settings = document.querySelector('#form-template-settings');
template.roulette.updateForm(form_template_settings);
$('.ui.checkbox').checkbox();


const svg_clippath = document.querySelector('#svg-arc');
const svg_roulette = document.querySelector('#roulette');
visibles.updateClipPath(svg_clippath);
visibles.updateRoulette(svg_roulette);


const form_cake_add_button = document.querySelector('#form-cake-add-button');
form_cake_add_button.addEventListener('click', _ => {
    template.roulette.add();

    template.roulette.updateForm(form_template_settings);

    const visibles = Roulette.onlyVisible(template.roulette);
    visibles.updateClipPath(svg_clippath);
    visibles.updateRoulette(svg_roulette);

    setupFormEventListener();

    document.dispatchEvent( new CustomEvent('change-roulette-setting', { detail: { template } }) );


    roulette_container.removeEventListener('click', roulette_init);
    roulette_container.removeEventListener('click', roulette_start);

    roulette_init();
});



document.addEventListener('change-roulette-setting', async (event) => {
    await RouletteStorage.updateTemplate(event.detail.template);

    $('.ui.checkbox').checkbox();

    roulette_container.removeEventListener('click', roulette_init);
    roulette_container.removeEventListener('click', roulette_start);

    roulette_init();


    document.querySelector(`.ui.form`).classList.remove('loading');
});

function setupFormEventListener() {
    const checkboxes = document.querySelectorAll('.form-cake-visible');
    for (const element of checkboxes) {
        element.addEventListener('change', _ => {
            const idx = parseInt(element.dataset.cake);

            console.log(element.checked);
            template.roulette[idx].visible = element.checked;
            //template.roulette.updateForm(form_template_settings);

            document.querySelector(`.ui.form`).classList.add('loading');

            setTimeout(_ => {

                template.roulette.updateForm(form_template_settings);

                const visibles = Roulette.onlyVisible(template.roulette);
                visibles.updateClipPath(svg_clippath);
                visibles.updateRoulette(svg_roulette);

                setupFormEventListener();

                document.dispatchEvent( new CustomEvent('change-roulette-setting', { detail: { template } }) );
            }, 300);
        });
    }

    for (const element of document.querySelectorAll('.form-cake-text')) {
        element.addEventListener('input', _ => {
            const idx = parseInt(element.dataset.cake);

            document.querySelector(`.svg-cake-text[data-cake="${idx}"]`).textContent = element.value;
            document.querySelector(`.form-cake-title[data-cake="${idx}"]`).textContent = `${idx + 1}. ${element.value}`;

            template.roulette[idx].text = element.value;

            document.dispatchEvent( new CustomEvent('change-roulette-setting', { detail: { template } }) );
        });
    }

    for (const element of document.querySelectorAll('.form-cake-color')) {
        element.addEventListener('change', _ => {
            const idx = parseInt(element.dataset.cake);

            document.querySelector(`.svg-cake-text[data-cake="${idx}"]`)
                    .setAttribute('fill', element.value);

            template.roulette[idx].textColor = element.value;

            document.dispatchEvent( new CustomEvent('change-roulette-setting', { detail: { template } }) );
        });
    }

    for (const element of document.querySelectorAll('.form-cake-background')) {
        element.addEventListener('change', _ => {
            const idx = parseInt(element.dataset.cake);

            document.querySelector(`.svg-cake-background[data-cake="${idx}"]`)
                    .setAttribute('fill', element.value);

            template.roulette[idx].backgroundColor = element.value;

            document.dispatchEvent( new CustomEvent('change-roulette-setting', { detail: { template } }) );
        });
    }


    const buttons = document.querySelectorAll('.form-cake-remove-button');
    if (Roulette.onlyVisible(template.roulette).length <= 2) {
        buttons.forEach(btn => {
            btn.classList.add('disabled')
        });

        let j = 0;
        while (j < template.roulette.length) {
            if (template.roulette[j].visible) {
                document.querySelector(`.form-cake-visible[data-cake="${j}"]`)
                        .setAttribute('disabled', 'true');
            }

            j++;
        }

    } else {

        for (const element of buttons) {

            const idx = parseInt(element.dataset.cake);
            if (template.roulette[idx].visible) {
                element.classList.remove('disabled');
            }

            element.addEventListener('click', _ => {

                template.roulette = Roulette.remove(template.roulette, idx);
                template.roulette.updateForm(form_template_settings);

                const visibles = Roulette.onlyVisible(template.roulette);
                visibles.updateClipPath(svg_clippath);
                visibles.updateRoulette(svg_roulette);

                setupFormEventListener();

                document.dispatchEvent( new CustomEvent('change-roulette-setting', { detail: { template } }) );
            });
        }
    }
}
setupFormEventListener();


form_input_template.addEventListener('input', evt => {
    template.name = evt.target.value;

    document.dispatchEvent( new CustomEvent('change-roulette-setting', { detail: { template } }) );

    selectedTemplate().textContent = evt.target.value;

    $('#form-template-name-select').dropdown('get item').text(evt.target.value);
    $('#form-template-name-select').dropdown('set text', escape(evt.target.value));
    $('#form-template-name-select').dropdown('refresh');
});



form_select_template.addEventListener('change', async evt => {
    form_input_template.value = selectedTemplate().textContent;

    const idx = parseInt(form_select_template.value);
    await settings.set('CurrentID', idx);

    console.log(idx);

    id = await settings.get('CurrentID');
    console.log(id);
    template = await RouletteStorage.getTemplate(id);

    template.roulette = Roulette.from(template.roulette);

    template.roulette.updateForm(form_template_settings);
    $('.ui.checkbox').checkbox();

    const visibles = Roulette.onlyVisible(template.roulette);
    visibles.updateClipPath(svg_clippath);
    visibles.updateRoulette(svg_roulette);

    setupFormEventListener();

    roulette_container.removeEventListener('click', roulette_init);
    roulette_container.removeEventListener('click', roulette_start);

    roulette_init();
});


function selectedTemplate() {
    for (const option of form_select_template.childNodes) {
        if (option.selected) {
            return option;
        }
    }

    return null;
}

const form_template_add_button = document.querySelector('#form-template-add-button');
form_template_add_button.addEventListener('click', async _ => {
    const idx = await RouletteStorage.addNewTemplate(template);

    await initFormSelect();
    $('#form-template-name-select').dropdown('refresh');

    $('#form-template-name-select').dropdown('set selected', idx);

    form_template_remove_button.classList.remove('disabled');
});

const form_template_remove_button = document.querySelector('#form-template-remove-button');
form_template_remove_button.addEventListener('click', async _ => {
    if (await RouletteStorage.countTemplates() >= 2) {
        await RouletteStorage.removeTemplate(id);

        id = await RouletteStorage.getFirstID();
        template = await RouletteStorage.getTemplate(id);

        await initFormSelect();
        $('#form-template-name-select').dropdown('refresh');

        $('#form-template-name-select').dropdown('set selected', id).trigger('change');
        //form_select_template.dispatchEvent(new Event('change'));

        if (await RouletteStorage.countTemplates() <= 1) {
            form_template_remove_button.classList.add('disabled');
        }

    } else {
        console.error('no remove template');
    }
});



const roulette_container = document.querySelector('.roulette-container');
const roulette = document.querySelector('#roulette');

function roulette_init(event = new Event('click')) {
    event.preventDefault();

    for (const element of document.querySelectorAll('.svg-cake-blink')) {
        element.classList.remove('on')
    }

    roulette.classList.remove('move');
    roulette.style.transform = `rotateZ(0deg)`;

    roulette_container.addEventListener('click', roulette_start, { once: true });
}

async function roulette_start(event = new Event('click')) {
    event.preventDefault();

    const rotate = Math.random() * 360;
    const duration = await settings.get('Duration') || 5000;

    const init_rotate = 360 * Math.floor( ( duration / 1000 ) * ( 8 / 5 ) );


    roulette.classList.add('move');
    roulette.style.transform = `rotateZ(${ init_rotate + rotate }deg)`;

    setTimeout(_ => {
        const visibles = Roulette.onlyVisible(template.roulette);

        const blink_number = Math.floor( ( rotate + ( visibles.degree / 2 ) ) / visibles.degree );
        console.log(blink_number);
        document.querySelector(`.svg-cake-blink[data-cake="${ blink_number % visibles.length }"]`).classList.add('on');

        roulette_container.addEventListener('click', roulette_init, { once: true });
    }, duration);
}

roulette_init();




async function change_theme(hex) {
    if (hex[0] != '#') {
        throw new Error('not hex');
    }

    document.body.style.backgroundColor = hex;
    await settings.set('Background', hex);

    let _h = hex.split('');
    let value = Math.max(
        parseInt(_h.slice(1, 3).join(''), 16),
        parseInt(_h.slice(3, 5).join(''), 16),
        parseInt(_h.slice(5, 7).join(''), 16)
    );
    value = value / parseInt('ff', 16);

    if (value > 0.5) {
        document.querySelector('#menu').classList.remove('inverted');
        document.querySelector('.footer > *').style.color = '#000000';

    } else {
        document.querySelector('#menu').classList.add('inverted');
        document.querySelector('.footer > *').style.color = '#ffffff';
    }
}

let _color = await settings.get('Background');
if (_color) {
    document.querySelector('#form-basic-background').value = _color;
    await change_theme(_color);

} else {
    document.querySelector('#form-basic-background').value = '#212121';
    await change_theme('#212121');
}
document.querySelector('#form-basic-background')
        .addEventListener('change', async (event) => {
    await change_theme(event.target.value);
});



async function change_width(bool = false) {
    await settings.set('EntireDisplay', bool);

    if (bool) {
        document.querySelector('.roulette-container > svg').style.minWidth = '100%';

    } else {
        document.querySelector('.roulette-container > svg').style.minWidth = '';
    }
}

let _display = await settings.get('EntireDisplay');
if (_display) {
    document.querySelector('#form-basic-display').checked = _display;
    await change_width(_display);

} else {
    document.querySelector('#form-basic-display').checked = false;
    await change_width(false);
}
document.querySelector('#form-basic-display')
        .addEventListener('change', async (event) => {
    await change_width(event.target.checked);
});



async function change_shadow(bool = true) {
    await settings.set('Shadow', bool);

    const shadow = document.querySelector('#svg-shadow > feDropShadow');
    if (bool) {
        shadow.setAttribute('dx', '1');
        shadow.setAttribute('dy', '1');
        shadow.setAttribute('stdDeviation', '1');

        document.querySelector('#roulette-shadow-root').setAttribute('fill', '#000000');

    } else {
        shadow.setAttribute('dx', '0');
        shadow.setAttribute('dy', '0');
        shadow.setAttribute('stdDeviation', '0');

        document.querySelector('#roulette-shadow-root').setAttribute('fill', 'none');
    }
}

let _shadow = await settings.get('Shadow');
document.querySelector('#form-basic-shadow').checked = (_shadow !== false);
await change_shadow(_shadow !== false);

document.querySelector('#form-basic-shadow')
        .addEventListener('change', async (event) => {
    await change_shadow(event.target.checked);
});



async function change_duration(_ms) {
    const ms = parseInt(_ms);

    let duration = 'Duration';
    let sec = 'sec';
    if (window.location.pathname === '/ja.html') {
        duration = '間隔';
        sec = '秒';
    }

    document.querySelector('label.form-basic-duration').textContent = `${duration} (${ Math.floor(ms / 1000) + sec })`;
    document.querySelector('#roulette').style.transitionDuration = `${ ms / 1000 }s`;

    await settings.set('Duration', ms);
}

let _duration = await settings.get('Duration');
if (_duration) {
    document.querySelector('input.form-basic-duration').value = _duration;
    await change_duration(_duration);

} else {
    document.querySelector('input.form-basic-duration').value = '5000';
    await change_duration(5000);
}
document.querySelector('input.form-basic-duration')
        .addEventListener('change', async (event) => {
    await change_duration(event.target.value);
});




document.querySelector('#form-template-import-button').addEventListener('click', _ => {
    const input = document.createElement('input');
    input.type = 'file';
    //input.accept = '.json';

    input.addEventListener('change', (event) => {
        const reader = new FileReader();

        reader.addEventListener('load', async (event) => {
            const template = {
                name: 'Import Template',
                roulette: JSON.parse(event.target.result)
            };
            const idx = await RouletteStorage.addNewTemplate(template);

            await initFormSelect();
            $('#form-template-name-select').dropdown('refresh');

            $('#form-template-name-select').dropdown('set selected', idx);

            form_template_remove_button.classList.remove('disabled');
        });
        reader.readAsText(event.target.files[0]);
    });
    input.click();
});


document.querySelector('#form-template-export-button').addEventListener('click', _ => {
    const json = JSON.stringify( Roulette.toObject(template.roulette) );
    const file = new File([json], 'test.json', { type: 'application/json' });

    const link = document.createElement('a');
    link.download = file.name;
    link.href = URL.createObjectURL(file);
    link.click();
});
