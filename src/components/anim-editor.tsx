/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { AnimNode, AnimObject, Timeline,
    EASING_OPTIONS, LINECAP_STYLES } from '../timeline'
import { debounce } from '../utils'

import { Slider } from './slider'

class BaseEditor extends React.Component<{
    data: any,
    timeline: Timeline,
}, {}> {
    state = {
        showUnsetFields: true,
    }

    refreshAnimObjectDebounced = debounce(() => {
        this.props.timeline.refreshAnimObject(this.props.data)
    }, 300)

    handleValueChange(key: string | string[], val: any) {
        if (Array.isArray(key))
            key.forEach((k, i) => this.props.data[k] = val[i])
        else
            this.props.data[key] = val
        this.props.timeline.forceUpdate()
        this.refreshAnimObjectDebounced()
    }

    unsetValue(key: string) {
        delete this.props.data[key]
        this.props.timeline.forceUpdate()
        this.refreshAnimObjectDebounced()
    }

    getInputs(fields: any) {
        return <div>
            { Object.keys(fields).map((key, index) => {
                if (typeof fields[key] === 'object') {
                    return <div key={ index }>
                        <h5># { key }</h5>
                        { this.getInputs(fields[key]) }
                        <hr />
                    </div>
                }
                else if (key in this.props.data || this.state.showUnsetFields) {
                    var elem = fields[key].call(this, key, index)
                    return elem.props.role === 'editor-field' ? elem :
                    <div className="form-group" key={ index }>
                        <label className="col-xs-4 control-label"
                            title="click to unset" style={{ cursor:'pointer' }}
                            onClick={ e => this.unsetValue(key) }>
                            { key in this.props.data ? <b>* { key }</b> : key }
                        </label>
                        <div className="col-xs-8">
                            { elem }
                        </div>
                    </div>
                }
            }) }
        </div>
    }

    getSimpleInput(key: string, type: string, holderText: string) {
        return <input type={ type } className="form-control" placeholder={ holderText }
            value={ this.props.data[key] }
            onChange={ e => this.handleValueChange(key, $(e.target).val()) } />
    }

    getCheckboxInput(key: string) {
        return <input type="checkbox"
            checked={ this.props.data[key] }
            onChange={ e => this.handleValueChange(key, e.target['checked']) } />
    }

    getNumberHolderText(min: number, max: number) {
        var holderText = 'number'
        if (min > -Infinity && max < Infinity)
            holderText = min + ' ~ ' + max
        else if (min > -Infinity)
            holderText = '> ' + min
        else if (max < Infinity)
            holderText = '< ' + max
        return holderText
    }

    getRangeInput(key: string, min = -Infinity, max = Infinity,
            step: number | string = 'any', holderText = '') {
        return <input type="range" className="form-control" placeholder={ holderText || this.getNumberHolderText(min, max) }
            min={ min } max={ max } step={ step } value={ this.props.data[key] }
            onChange={ e => this.handleValueChange(key, parseFloat($(e.target).val())) } />
    }

    getNumberWithSliderInput(key: string, step: number,
            scale = 1, min = -Infinity, max = Infinity, holderText = '') {
        var val = this.props.data[key] || 0
        return <div className="input-group">
            <Slider className="input-group-addon" valueY={ 0 } valueX={ val }
                step={ step } scale={ scale } range={{ minX:min, maxX:max }}
                onChange={ (x, y) => this.handleValueChange(key, x) }>
                ↔
            </Slider>
            <input type="text" className="form-control" placeholder={ holderText || this.getNumberHolderText(min, max) }
                min={ min } max={ max } step={ step } value={ this.props.data[key] }
                onChange={ e => this.handleValueChange(key, $(e.target).val()) } />
        </div>
    }

    getSelectInput(key: string, values: string[]) {
        var val = this.props.data[key]

        // https://github.com/facebook/react/issues/4085
        if (val === undefined) val = ''

        return <select value={ val } className="form-control"
                onChange={ e => this.handleValueChange(key, $(e.target).val()) }>
            {values.map((val, index) => <option key={ index }>{ val }</option>)}
        </select>
    }

    getTextWithSelectInput(key: string, values: string[], holderText: string) {
        var val = this.props.data[key]
        return <div className="input-group">
            <input type="text" className="form-control" placeholder={ holderText }
                value={ val }
                onChange={ e => this.handleValueChange(key, $(e.target).val()) } />
            <div className="input-group-btn">
                <button type="button" className="btn dropdown-toggle" data-toggle="dropdown">
                    <span className="caret" />
                </button>
                <ul className="dropdown-menu dropdown-menu-right">
                    {values.map((val, index) => <li key={ index }>
                        <a onClick={ e => this.handleValueChange(key, val) }>{ val }</a>
                    </li>)}
                </ul>
            </div>
        </div>
    }

    getJsonValue(val: any) {
        return val && val.err ? val.err : JSON.stringify(val)
    }

    handleJsonChange(key: string, val: string) {
        try {
            val = JSON.parse(val)
            this.handleValueChange(key, val)
        }
        catch (e) {
            this.props.data[key] = { err:val }
            this.props.timeline.forceUpdate()
        }
    }

    getJsonInput(key: string, holderText: string) {
        var val = this.props.data[key]
        return <div className={ val && val.err ? 'has-error' : '' }>
            <input type="text" className="form-control" placeholder={ holderText }
                value={ this.getJsonValue(this.props.data[key]) }
                onChange={ e => this.handleJsonChange(key, $(e.target).val()) } />
        </div>
    }

    getJsonTextarea(key: string, holderText: string) {
        var val = this.props.data[key]
        return <div className={ val && val.err ? 'has-error' : '' }>
            <textarea className="form-control" placeholder={ holderText }
                value={ this.getJsonValue(this.props.data[key]) || '' }
                onChange={ e => this.handleJsonChange(key, $(e.target).val()) } />
        </div>
    }

    getTransitValueText(val: any): string {
        var key
        if (val === 0)
            return '0'
        else if (!val)
            return ''
        else if (val.err)
            return val.err
        else if (val.substr)
            return val
        else if (key = Object.keys(val)[0])
            return key + ':' + val[key]
        else
            return val
    }

    getTransitValueNumber(val: any): number {
        var key
        if (!val)
            return 0
        else if (val.err)
            return 0
        else if (val.substr)
            return parseFloat(val[key])
        else if (key = Object.keys(val)[0])
            return parseFloat(val[key])
        else
            return parseFloat(val)
    }

    getNewTransitValue(key: string, newVal: number) {
        var val = this.props.data[key]
        if (!val)
            return newVal
        else if (val.err)
            return newVal
        else if (val.substr)
            return val.replace(/^-?[\d\.]+/, newVal)
        else if (key = Object.keys(val)[0]) {
            if (val[key] && val[key].substr)
                val[key] = val.replace(/^-?[\d\.]+/, newVal)
            else
                val[key] = newVal
            return val
        }
        else
            return newVal
    }

    handleTransitValueChange(key: string, type: string, val: string) {
        var sp = val.split(':')
        if (sp.length === 1) {
            var v = type === 'number' ? parseFloat(val) || 0 : val
            if (v == val)
                return this.handleValueChange(key, v)
        }
        else if (sp.length === 2) {
            var vs: any[] = sp
            if (type === 'number')
                vs = sp.map(parseFloat)
            if (vs[0] == sp[0] && vs[1] == sp[1])
                return this.handleValueChange(key, { [vs[0]]: vs[1] })
        }
        this.handleValueChange(key, { err: val })
    }

    getTransitValueInput(key: string, holderText: string, type: string = '') {
        var val = this.props.data[key]
        return <div className={ val && val.err ? 'has-error' : '' }>
            <input type="text" className="form-control" placeholder={ holderText }
                value={ this.getTransitValueText(this.props.data[key]) }
                onChange={ e => this.handleTransitValueChange(key, type, $(e.target).val()) } />
        </div>
    }

    getTransitWithSliderInput(key: string, step: number,
            scale = 1, min = -Infinity, max = Infinity, holderText = '') {
        var val = this.props.data[key]
        return <div className="input-group">
            <Slider className="input-group-addon" valueY={ 0 } valueX={ this.getTransitValueNumber(val) }
                step={ step } scale={ scale } range={{ minX:min, maxX:max }}
                onChange={ (x, y) => this.handleValueChange(key, this.getNewTransitValue(key, x)) }>
                ↔
            </Slider>
            <input type="text" className="form-control" placeholder={ holderText || this.getNumberHolderText(min, max) }
                min={ min } max={ max } step={ step } value={ this.getTransitValueText(this.props.data[key]) }
                onChange={ e => this.handleTransitValueChange(key, 'number', $(e.target).val()) } />
        </div>
    }

    handleTransitCoordChange(kx: string, vx: number, ky: string, vy: number) {
        this.handleValueChange([kx, ky], [
            this.getNewTransitValue(kx, vx),
            this.getNewTransitValue(ky, vy),
        ])
    }

    getTransitCoordGroup(key: string, index: number, kx: string, ky: string, range = null, scale = 1, step = 1) {
        var vx = this.props.data[kx],
            vy = this.props.data[ky]
        return <div className="form-group" key={ index } role="editor-field">
            <label className="col-xs-4 control-label"
                title="click to unset" style={{ cursor:'pointer' }}
                onClick={ e => void(this.unsetValue(kx), this.unsetValue(ky)) }>
                { kx in this.props.data || ky in this.props.data ? <b>* { key }</b> : key }
            </label>
            <div className="col-xs-8">
                <div className={ 'input-group ' + ((vx && vx.err) || (vy && vy.err) ? 'has-error' : '') }>
                    <Slider className="input-group-addon" range={ range } scale={ scale } step={ step }
                        valueX={ this.getTransitValueNumber(vx) } valueY={ this.getTransitValueNumber(vy) }
                        onChange={ (x, y) => this.handleTransitCoordChange(kx, x, ky, y) }>
                        @
                    </Slider>
                    <input type="text" className="form-control" placeholder="x"
                        value={ this.getTransitValueText(vx) }
                        onChange={ e => this.handleTransitValueChange(kx, 'number', $(e.target).val()) } />
                    <span style={{ width:0, display:"table-cell" }}></span>
                    <input type="text" className="form-control" style={{ borderLeft:'none' }} placeholder="y"
                        value={ this.getTransitValueText(vy) }
                        onChange={ e => this.handleTransitValueChange(ky, 'number', $(e.target).val()) } />
                </div>
            </div>
        </div>
    }

    getColorInput(key: string) {
        var val = this.props.data[key]
        return <div className="input-group" style={{ width:'100%' }}>
            <input type="text" className="form-control" placeholder="color"
                style={{ borderRight:'none' }}
                value={ val }
                onChange={ e => this.handleValueChange(key, $(e.target).val()) } />
            <span style={{ width:0, display:"table-cell" }}></span>
            <input type="color" className="form-control"
                style={{ borderLeft:'none', minWidth:40 }}
                value={ /#[0-9a-fA-F]{6}/.test(val) ? val : null }
                onChange={ e => this.handleValueChange(key, $(e.target).val()) } />
        </div>
    }
}

export class NodeEditor extends BaseEditor {
    transitFields = {
        type:                   k => this.getSelectInput(k, ['', 'circle', 'line']),
        isShowInit:             k => this.getCheckboxInput(k),
        isShowEnd:              k => this.getCheckboxInput(k),

        repeat:                 k => this.getNumberWithSliderInput(k, 1, 0.2, 0, 100),
        yoyo:                   k => this.getCheckboxInput(k),
        easing:                 k => this.getTextWithSelectInput(k, EASING_OPTIONS, 'easing or bezier paramters'),
        svgPathOpt: {
            bitPathType:        k => this.getSelectInput(k, ['', 'path', 'ellipse']),
            bitPathStr:         k => this.getSimpleInput(k, 'text', 'path d attribute'),
            zIndex:             k => this.getNumberWithSliderInput(k, 1, 1, -1000, 1000),
        },
        stroke: {
            stroke:             k => this.getColorInput(k),
            strokeWidth:        k => this.getTransitWithSliderInput(k, 0.5, 0.1, 0, 100),
            strokeOpacity:      k => this.getRangeInput(k, 0, 1, 0.01),
            strokeDasharray:    k => this.getTransitValueInput(k, 'string value'),
            strokeDashoffset:   k => this.getTransitValueInput(k, 'string value or value:value'),
            strokeLinecap:      k => this.getSelectInput(k, LINECAP_STYLES),
        },
        fill: {
            fill:               k => this.getColorInput(k),
            fillOpacity:        k => this.getRangeInput(k, 0, 1, 0.01),
            points:             k => this.getNumberWithSliderInput(k, 1, 1, 0),
            opacity:            k => this.getRangeInput(k, 0, 1, 0.01),
        },
        align: {
            position:           (k, i) => this.getTransitCoordGroup(k, i, 'x', 'y'),
            shift:              (k, i) => this.getTransitCoordGroup(k, i, 'shiftX', 'shiftY'),
            angle:              k => this.getNumberWithSliderInput(k, 1, 1, 0, 360),
        },
        shape: {
            radius:             (k, i) => this.getTransitWithSliderInput(k, 0.1, 0.1, 0),
            radiusXY:           (k, i) => this.getTransitCoordGroup(k, i, 'radiusX', 'radiusY', { minX:0, minY:0 }, 0.1, 0.1),
            sizeGap:            k => this.getNumberWithSliderInput(k, 1, 1, 0),
        },
    }
    burstFields = {
        type:                   k => this.getSelectInput(k, ['', 'circle', 'line']),

        repeat:                 k => this.getNumberWithSliderInput(k, 1, 0.2, 0, 100),
        yoyo:                   k => this.getCheckboxInput(k),
        easing:                 k => this.getTextWithSelectInput(k, EASING_OPTIONS, 'easing or bezier paramters'),
        display: {
            count:              k => this.getNumberWithSliderInput(k, 1, 1, 0),
            degree:             k => this.getTransitWithSliderInput(k, 1, 1, 0, 360),
            opacity:            k => this.getRangeInput(k, 0, 1, 0.01),
            randomAngle:        k => this.getNumberWithSliderInput(k, 1, 1, 0, 360),
            randomRadius:       k => this.getNumberWithSliderInput(k, 1, 1, 0, 1000),
        },
        stroke: {
            stroke:             k => this.getColorInput(k),
            strokeWidth:        k => this.getTransitWithSliderInput(k, 0.5, 0.1, 0, 100),
            strokeOpacity:      k => this.getRangeInput(k, 0, 1, 0.01),
            strokeDasharray:    k => this.getTransitValueInput(k, 'string value'),
            strokeDashoffset:   k => this.getTransitValueInput(k, 'string value or value:value'),
            strokeLinecap:      k => this.getSelectInput(k, LINECAP_STYLES),
        },
        fill: {
            fill:               k => this.getColorInput(k),
            fillOpacity:        k => this.getRangeInput(k, 0, 1, 0.01),
            points:             k => this.getNumberWithSliderInput(k, 1, 1, 0),
        },
        align: {
            position:           (k, i) => this.getTransitCoordGroup(k, i, 'x', 'y'),
            shift:              (k, i) => this.getTransitCoordGroup(k, i, 'shiftX', 'shiftY'),
            angle:              k => this.getNumberWithSliderInput(k, 1, 1, 0, 360),
        },
        shape: {
            radius:             (k, i) => this.getTransitWithSliderInput(k, 0.1, 0.1, 0),
            radiusXY:           (k, i) => this.getTransitCoordGroup(k, i, 'radiusX', 'radiusY', { minX:0, minY:0 }, 0.1, 0.1),
            sizeGap:            k => this.getNumberWithSliderInput(k, 1, 1, 0),
        },
        // TODO: add child options
    }

    motionPathFields = {
        easing:                 k => this.getTextWithSelectInput(k, EASING_OPTIONS, 'easing or bezier paramters'),
        element: {
            elemName:           k => this.getSimpleInput(k, 'text', 'name of element'),
            pathName:           k => this.getSimpleInput(k, 'text', 'name of path'),
            path:               k => this.getSimpleInput(k, 'text', 'path d attribute'),
        },
        path: {
            isAngle:            k => this.getCheckboxInput(k),
            angleOffset:        k => this.getNumberWithSliderInput(k, 1, 1, 0, 360),
            isReverse:          k => this.getCheckboxInput(k),
            pathStart:          k => this.getRangeInput(k, 0, 1, 0.01),
            pathEnd:            k => this.getRangeInput(k, 0, 1, 0.01),
        },
        align: {
            position:           (k, i) => this.getTransitCoordGroup(k, i, 'x', 'y'),
            offset:             (k, i) => this.getTransitCoordGroup(k, i, 'offsetX', 'offsetY'),
            angle:              k => this.getNumberWithSliderInput(k, 1, 1, 0, 360),
        },
    }

    commonFields = {
        delay:                  k => this.getNumberWithSliderInput(k, 1, 5, 0),
        duration:               k => this.getNumberWithSliderInput(k, 1, 5, 0),
    }

    render() {
        var fields = {
                transit: this.transitFields,
                burst: this.burstFields,
                'motion-path': this.motionPathFields,
            }[this.props.data.animType] || { },
            timeline = this.props.timeline

        if (this.props.data.animType === 'motion-path') {
            var names = ['']
            this.props.timeline.getTimeline().forEach(anim => names.push(anim.name))
            fields.element.elemName = k => this.getSelectInput(k, names)
            fields.element.pathName = k => this.getSelectInput(k, names)
        }

        return <form className="form-horizontal">
            <div className="form-group">
                <div className="col-xs-12">
                    <a className="btn btn-danger"
                        onClick={ e => timeline.removeActiveAnimNode() }
                        title="shortcut: Del">Remove</a>
                    &nbsp;
                    <a className="btn btn-primary"
                        onClick={ e => timeline.cloneActiveAnimNode() }
                        title="shortcut: Ctrl-C">Clone</a>
                    <label className="pull-right" style={{ cursor:'pointer' }}>
                        <input type="checkbox" checked={ this.state.showUnsetFields }
                            onChange={ e => this.setState({ showUnsetFields:e.target['checked'] }) } />
                        &nbsp;
                        show unset fields
                    </label>
                </div>
            </div>
            { this.getInputs(this.commonFields) }
            { this.getInputs(fields) }
        </form>
    }
}

export class ObjectEditor extends BaseEditor {
    commonFields = {
        name:       k => this.getSimpleInput(k, 'text', 'animation name'),
        disabled:   k => this.getCheckboxInput(k),
    }

    transitFields = {
        stagger:    k => this.getJsonTextarea(k, 'key: attr[]'),
        delayDelta: k => this.getNumberWithSliderInput(k, 1, 1, 0)
    }

    render() {
        var fields = {
                transit: this.transitFields,
            }[this.props.data.animType] || { },
            timeline = this.props.timeline

        return <form className="form-horizontal">
            <div className="form-group">
                <div className="col-xs-12">
                    <a className="btn btn-danger"
                        onClick={ e => timeline.removeActiveAnimObject() }
                        title="shortcut: Del">Remove</a>
                    &nbsp;
                    <a className="btn btn-primary"
                        onClick={ e => timeline.cloneActiveAnimObject() }
                        title="shortcut: Ctrl-C">Clone</a>
                    &nbsp;
                    <a className="btn btn-default"
                        onClick={ e => timeline.addAnimNode() }>Add Node</a>
                </div>
            </div>
            { this.getInputs(this.commonFields) }
            { this.getInputs(fields) }
        </form>
    }
}
