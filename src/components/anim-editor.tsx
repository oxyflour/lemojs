/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { AnimNode, AnimObject, Timeline, AnimManager,
    EASING_OPTIONS, LINECAP_STYLES } from '../timeline'
import { BaseEditor } from './anim-base-editor'
import { Slider } from './slider'

import * as SVGPathData from 'svg-pathdata'

export class NodeEditor extends BaseEditor<{
    data: AnimNode
    timeline: Timeline
}> {
    transitFields = {
        type:                   k => this.getSelectInput(k, ['', 'circle', 'line']),
        isShowInit:             k => this.getCheckboxInput(k),
        isShowEnd:              k => this.getCheckboxInput(k),

        repeat:                 k => this.getNumberWithSliderInput(k, 1, 0.2, 0, 100),
        yoyo:                   k => this.getCheckboxInput(k),
        easing:                 k => this.getTextWithSelectInput(k, EASING_OPTIONS, 'easing or bezier paramters'),
        svgPathOpt: {
            bitPathType:        k => this.getSelectInput(k, ['', 'path', 'ellipse']),
            bitPathStr:         k => this.getEditablePathInput(k, 'path d attribute'),
            zIndex:             k => this.getNumberWithSliderInput(k, 1, 1, -1000, 1000),
        },
        stroke: {
            stroke:             k => this.getColorInput(k),
            strokeWidth:        k => this.getTweenableWithSliderInput(k, 0.5, 0.1, 0, 100),
            strokeOpacity:      k => this.getRangeInput(k, 0, 1, 0.01),
            strokeDasharray:    k => this.getTweenableInput(k, 'string value'),
            strokeDashoffset:   k => this.getTweenableInput(k, 'string value or value:value'),
            strokeLinecap:      k => this.getSelectInput(k, LINECAP_STYLES),
        },
        fill: {
            fill:               k => this.getColorInput(k),
            fillOpacity:        k => this.getRangeInput(k, 0, 1, 0.01),
            points:             k => this.getNumberWithSliderInput(k, 1, 1, 0),
            opacity:            k => this.getRangeInput(k, 0, 1, 0.01),
        },
        align: {
            shift:              (k, i) => this.getTweenablePairInput(k, i, 'shiftX', 'shiftY'),
            angle:              k => this.getNumberWithSliderInput(k, 1, 1, 0, 360),
        },
        shape: {
            radius:             (k, i) => this.getTweenableWithSliderInput(k, 0.1, 0.1, 0),
            radiusXY:           (k, i) => this.getTweenablePairInput(k, i, 'radiusX', 'radiusY', { minX:0, minY:0 }, 0.1, 0.1),
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
            degree:             k => this.getTweenableWithSliderInput(k, 1, 1, 0, 360),
            opacity:            k => this.getRangeInput(k, 0, 1, 0.01),
            randomAngle:        k => this.getNumberWithSliderInput(k, 1, 1, 0, 360),
            randomRadius:       k => this.getNumberWithSliderInput(k, 1, 1, 0, 1000),
        },
        stroke: {
            stroke:             k => this.getColorInput(k),
            strokeWidth:        k => this.getTweenableWithSliderInput(k, 0.5, 0.1, 0, 100),
            strokeOpacity:      k => this.getRangeInput(k, 0, 1, 0.01),
            strokeDasharray:    k => this.getTweenableInput(k, 'string value'),
            strokeDashoffset:   k => this.getTweenableInput(k, 'string value or value:value'),
            strokeLinecap:      k => this.getSelectInput(k, LINECAP_STYLES),
        },
        fill: {
            fill:               k => this.getColorInput(k),
            fillOpacity:        k => this.getRangeInput(k, 0, 1, 0.01),
            points:             k => this.getNumberWithSliderInput(k, 1, 1, 0),
        },
        align: {
            shift:              (k, i) => this.getTweenablePairInput(k, i, 'shiftX', 'shiftY'),
            angle:              k => this.getNumberWithSliderInput(k, 1, 1, 0, 360),
        },
        shape: {
            radius:             (k, i) => this.getTweenableWithSliderInput(k, 0.1, 0.1, 0),
            radiusXY:           (k, i) => this.getTweenablePairInput(k, i, 'radiusX', 'radiusY', { minX:0, minY:0 }, 0.1, 0.1),
            sizeGap:            k => this.getNumberWithSliderInput(k, 1, 1, 0),
        },
        // TODO: add child options
    }

    motionPathFields = {
        easing:                 k => this.getTextWithSelectInput(k, EASING_OPTIONS, 'easing or bezier paramters'),
        element: {
            elemName:           k => this.getSimpleInput(k, 'text', 'name of element'),
            pathName:           k => this.getSimpleInput(k, 'text', 'name of path'),
            path:               k => this.getEditablePathInput(k, 'path d attribute'),
        },
        path: {
            isAngle:            k => this.getCheckboxInput(k),
            angleOffset:        k => this.getNumberWithSliderInput(k, 1, 1, 0, 360),
            isReverse:          k => this.getCheckboxInput(k),
            pathStart:          k => this.getRangeInput(k, 0, 1, 0.01),
            pathEnd:            k => this.getRangeInput(k, 0, 1, 0.01),
        },
        align: {
            offset:             (k, i) => this.getTweenablePairInput(k, i, 'offsetX', 'offsetY'),
            angle:              k => this.getNumberWithSliderInput(k, 1, 1, 0, 360),
        },
    }

    commonFields = {
        delay:                  k => this.getNumberWithSliderInput(k, 1, 5, 0),
        duration:               k => this.getNumberWithSliderInput(k, 1, 5, 0),
    }

    allowToShow(key: string) {
        if (this.props.data.animType === 'transit' && key === 'bitPathStr')
            return this.props.data['bitPathType'] === 'path'
        if (this.props.data.animType === 'motion-path' && key === 'path')
            return !this.props.data['pathName']
        return super.allowToShow(key)
    }

    attachedPath: string
    getEditablePathInput(key: string, holderText: string) {
        return <div className="input-group">
            <Slider valueX={ 0 } valueY={ 0 }
                onStart={ (x, y, e) => (this.attachedPath = this.props.data[key],
                    e.preventDefault(), $(e.target).parent().addClass('active-input has-warning')) }
                onEnd={ (x, y) => $('.active-input').removeClass('active-input has-warning') }
                onChange={ (x, y) => this.attachedPath &&
                    this.handleValueChange(key, new SVGPathData(this.attachedPath).translate(x, y).encode()) }
                className="input-group-addon" style={{ cursor:'pointer' }}
                title="drag to translate path">@</Slider>
            <input type="text" className="form-control" placeholder={ holderText }
                value={ this.props.data[key] }
                onFocus={ e => this.props.timeline.setPathToEdit(this.props.data, key) }
                onBlur={ e => this.props.timeline.setPathToEdit(null, key) }
                onChange={ e => this.handleValueChange(key, $(e.target).val()) } />
        </div>
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

export class ObjectEditor extends BaseEditor<{
    data: AnimObject
    timeline: Timeline
}> {
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
