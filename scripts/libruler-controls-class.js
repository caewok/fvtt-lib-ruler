import { MODULE_ID, log } from "./module.js";

// Create the ability for modules to add switches to the Foundry Ruler control
// When the control is active, display any registered buttons in a third column

export class libRulerToolBar extends FormApplication {
    constructor() {
        super(...arguments);
    }
    static get defaultOptions() {
        const options = {
            classes: ['form'],
            left: 98,
            popOut: false,
            template: `modules/${MODULE_ID}/templates/libruler-controls.html`,
            id: 'libruler-config',
            title: game.i18n.localize('Default libRuler'),
            closeOnSubmit: false,
            submitOnChange: false,
            submitOnClose: false
        };
        options['editable'] = true;
        return mergeObject(super.defaultOptions, options);
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('.control-tool[data-tool]', html).on("click", this._onHandleClick.bind(this));
    }

    getData(options) {
        return { multiple: 5 };
    }

    _onHandleClick(event) {
        const btn = event.currentTarget;
        log(event);
//        let idx = TerrainLayer.multipleOptions.indexOf(canvas.terrain.defaultmultiple);
//        idx = Math.clamped(($(btn).attr('id') == 'tl-inc-cost' ? idx + 1 : idx - 1), 0, TerrainLayer.multipleOptions.length - 1);
//        canvas.terrain.defaultmultiple = TerrainLayer.multipleOptions[idx];
//        $('#tl-defaultcost', this.element).html(TerrainLayer.multipleText(canvas.terrain.defaultmultiple));
    }
}
