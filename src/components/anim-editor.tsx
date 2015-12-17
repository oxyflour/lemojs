/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { AnimNode, AnimObject, Timeline } from '../timeline'
import { debounce } from '../utils'

const EASING_OPTIONS = ['', 'cubic.in', 'cubic.out', 'sin.in', 'sin.out']

const LINECAP_STYLES = ['', 'normal', 'round']

class Unstringified {
    constructor(public content: string) { }
}

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

    handleValueChange(key: string, val: any) {
        this.props.data[key] = val
        this.props.timeline.forceUpdate()
        this.refreshAnimObjectDebounced()
    }

    handleJsonChange(key: string, val: string) {
        try {
            val = JSON.parse(val)
            this.handleValueChange(key, val)
        }
        catch (e) {
            this.props.data[key] = new Unstringified(val)
            this.props.timeline.forceUpdate()
        }
    }

    unsetValue(key: string) {
        delete this.props.data[key]
        this.props.timeline.forceUpdate()
        this.props.timeline.refreshAnimObject(this.props.data)
    }

    getInputs(fields: any) {
        return <div>
            { Object.keys(fields).map((key, index) =>
                typeof fields[key] === 'object' ?
                <div key={ index }>
                    <h5># { key }</h5>
                    { this.getInputs(fields[key]) }
                    <hr />
                </div> :
                (key in this.props.data || this.state.showUnsetFields) &&
                <div className="form-group" key={ index }>
                    <label className="col-xs-4 control-label"
                        title="click to unset" style={{ cursor:'pointer' }}
                        onClick={ e => this.unsetValue(key) }>
                        { key in this.props.data ? <b>* { key }</b> : key }
                    </label>
                    <div className="col-xs-8">
                        { fields[key].call(this, key) }
                    </div>
                </div>
            ) }
        </div>
    }

    getSimpleInput(type: string, holderText: string, key: string) {
        return <input type={ type } className="form-control" placeholder={ holderText }
            value={ this.props.data[key] }
            onChange={ e => this.handleValueChange(key, $(e.target).val()) } />
    }

    getCheckboxInput(key: string) {
        return <input type="checkbox"
            checked={ this.props.data[key] }
            onChange={ e => this.handleValueChange(key, e.target['checked']) } />
    }

    getNumberRangeInput(type: string, min: number, max: number, step: number,
            holderText: string, key: string) {
        if (!holderText) {
            holderText = 'number'
            if (min > -Infinity && max < Infinity)
                holderText = min + ' ~ ' + max
            else if (min > -Infinity)
                holderText = '> ' + min
            else if (max < Infinity)
                holderText = '< ' + max
        }

        return <input type={ type } className="form-control" placeholder={ holderText }
            min={ min } max={ max } step={ step } value={ this.props.data[key] }
            onChange={ e => this.handleValueChange(key, parseFloat($(e.target).val())) } />
    }

    getSelectInput(values: string[], key: string) {
        var val = this.props.data[key]

        // https://github.com/facebook/react/issues/4085
        if (val === undefined) val = ''

        return <select value={ val } className="form-control"
                onChange={ e => this.handleValueChange(key, $(e.target).val()) }>
            {values.map((val, index) => <option key={ index }>{ val }</option>)}
        </select>
    }

    getJsonValue(val: any) {
        return val instanceof Unstringified ? (val as Unstringified).content : JSON.stringify(val)
    }

    getJsonInput(holderText: string, key: string) {
        return <div className={ this.props.data[key] instanceof Unstringified ? 'has-error' : '' }>
            <input type="text" className="form-control" placeholder={ holderText }
                value={ this.getJsonValue(this.props.data[key]) }
                onChange={ e => this.handleJsonChange(key, $(e.target).val()) } />
        </div>
    }

    getJsonTextarea(holderText: string, key: string) {
        return <div className={ this.props.data[key] instanceof Unstringified ? 'has-error' : '' }>
            <textarea className="form-control" placeholder={ holderText }
                value={ this.getJsonValue(this.props.data[key]) || '' }
                onChange={ e => this.handleJsonChange(key, $(e.target).val()) } />
        </div>
    }

    getColorInput(key: string) {
        var value = this.props.data[key]
        return <div className="input-group" style={{ width:'100%' }}>
            <input type="text" className="form-control" placeholder="color"
                value={ value }
                onChange={ e => this.handleValueChange(key, $(e.target).val()) } />
            {/* http://stackoverflow.com/questions/18954117/input-group-two-inputs-close-to-each-other */}
            <span style={{ width:0, display:"table-cell" }}></span>
            <input type="color" className="form-control"
                style={{ borderLeft:'none' }}
                value={ /#[0-9a-fA-F]{6}/.test(value) ? value : null }
                onChange={ e => this.handleValueChange(key, $(e.target).val()) } />
        </div>
    }

    makeTextInput(holderText = '') {
        return this.getSimpleInput.bind(this, 'text', holderText)
    }

    makeColorInput() {
        return this.getColorInput.bind(this)
    }

    makeCheckboxInput() {
        return this.getCheckboxInput.bind(this)
    }

    makeNumberInput(min = -Infinity, max = Infinity, step = 0, holderText = '') {
        return this.getNumberRangeInput.bind(this, 'number', min, max, step, holderText)
    }

    makeRangeInput(min = -Infinity, max = Infinity, step = 0, holderText = '') {
        return this.getNumberRangeInput.bind(this, 'range', min, max, step, holderText)
    }

    makeSelectInput(values: string[]) {
        return this.getSelectInput.bind(this, values)
    }

    makeJsonInput(holderText = '', isLarge = false) {
        return isLarge ?
            this.getJsonTextarea.bind(this, holderText) :
            this.getJsonInput.bind(this, holderText)
    }
}

export class NodeEditor extends BaseEditor {
    transitFields = {
        type:                   this.makeSelectInput(['', 'circle', 'line']),
        isShowInit:             this.makeCheckboxInput(),
        isShowEnd:              this.makeCheckboxInput(),

        repeat:                 this.makeNumberInput(0, 100, 1),
        yoyo:                   this.makeCheckboxInput(),
        easing:                 this.makeSelectInput(EASING_OPTIONS),
        svgPathOpt: {
            bitPathType:        this.makeSelectInput(['', 'path', 'ellipse']),
            bitPathStr:         this.makeTextInput('path d attribute'),
            zIndex:             this.makeNumberInput(),
        },
        stroke: {
            stroke:             this.makeColorInput(),
            strokeWidth:        this.makeNumberInput(0, 100, 0.1),
            strokeOpacity:      this.makeRangeInput(0, 1, 0.01),
            strokeDasharray:    this.makeJsonInput('json literal'),
            strokeDashoffset:   this.makeJsonInput('json literal'),
            strokeLinecap:      this.makeSelectInput(LINECAP_STYLES),
        },
        fill: {
            fill:               this.makeColorInput(),
            fillOpacity:        this.makeRangeInput(0, 1, 0.01),
            points:             this.makeNumberInput(),
            opacity:            this.makeRangeInput(0, 1, 0.01),
        },
        align: {
            x:                  this.makeNumberInput(),
            y:                  this.makeNumberInput(),
            shiftX:             this.makeJsonInput('number or json literal'),
            shiftY:             this.makeJsonInput('number or json literal'),
            angle:              this.makeNumberInput(0, 360),
        },
        shape: {
            radius:             this.makeJsonInput('number or json literal'),
            radiusX:            this.makeJsonInput('number or json literal'),
            radiusY:            this.makeJsonInput('number or json literal'),
            sizeGap:            this.makeNumberInput(0),
        },
    }
    burstFields = {
        type:                   this.makeSelectInput(['', 'circle', 'line']),

        repeat:                 this.makeNumberInput(0, 100, 1),
        yoyo:                   this.makeCheckboxInput(),
        easing:                 this.makeSelectInput(EASING_OPTIONS),
        display: {
            count:              this.makeNumberInput(0),
            degree:             this.makeNumberInput(0, 360),
            opacity:            this.makeRangeInput(0, 1, 0.01),
            randomAngle:        this.makeNumberInput(0, 360),
            randomRadius:       this.makeNumberInput(0, 360),
        },
        stroke: {
            stroke:             this.makeColorInput(),
            strokeWidth:        this.makeNumberInput(0, 100, 0.1),
            strokeOpacity:      this.makeRangeInput(0, 1, 0.01),
            strokeDasharray:    this.makeJsonInput('json literal'),
            strokeDashoffset:   this.makeJsonInput('json literal'),
            strokeLinecap:      this.makeSelectInput(LINECAP_STYLES),
        },
        fill: {
            fill:               this.makeColorInput(),
            fillOpacity:        this.makeRangeInput(0, 1, 0.01),
            points:             this.makeNumberInput(),
        },
        align: {
            x:                  this.makeNumberInput(),
            y:                  this.makeNumberInput(),
            shiftX:             this.makeJsonInput('number or json literal'),
            shiftY:             this.makeJsonInput('number or json literal'),
            angle:              this.makeNumberInput(0, 360),
        },
        shape: {
            radius:             this.makeJsonInput('number or json literal'),
            radiusX:            this.makeJsonInput('number or json literal'),
            radiusY:            this.makeJsonInput('number or json literal'),
            sizeGap:            this.makeNumberInput(0),
        },
        // TODO: add child options
    }

    commonFields = {
        delay: this.makeNumberInput(0),
        duration: this.makeNumberInput(0),
    }

    render() {
        var fields = {
                transit: this.transitFields,
                burst: this.burstFields,
            }[this.props.data.animType] || { },
            timeline = this.props.timeline
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
    fields = {
        name:       this.makeTextInput('animation name'),
        disabled:   this.makeCheckboxInput(),
        stagger:    this.makeJsonInput('key: attr[]', true),
        delayDelta: this.makeNumberInput(0)
    }
    render() {
        var timeline = this.props.timeline
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
                </div>
            </div>
            { this.getInputs(this.fields) }
        </form>
    }
}
