/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { Tween, Animation, AnimManager,
    EASING_OPTIONS, LINECAP_STYLES } from '../timeline'
import { BaseEditor } from './anim-base-editor'
import { Slider } from './slider'

import * as SVGPathData from 'svg-pathdata'

export class TweenEditor extends BaseEditor<{
    data: Tween
    motionNames: string[]
    onChange: (data: Tween) => void
    removeActiveTween: () => void
    cloneActiveTween: () => void
    selectPathToEdit: (key: string) => void
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
            <span className="input-group-addon" style={{ cursor:'pointer' }} title="click to edit"
                onClick={ e => this.props.selectPathToEdit(key) }>#</span>
            <input type="text" className="form-control" placeholder={ holderText }
                value={ this.props.data[key] }
                onChange={ e => this.handleValueChange(key, $(e.target).val()) } />
        </div>
    }

    render() {
        var fields = {
                transit: this.transitFields,
                burst: this.burstFields,
                'motion-path': this.motionPathFields,
            }[this.props.data.animType] || { }

        if (this.props.data.animType === 'motion-path') {
            var names = [''].concat(this.props.motionNames)
            fields.element.elemName = k => this.getSelectInput(k, names)
            fields.element.pathName = k => this.getSelectInput(k, names)
        }

        return <form className="form-horizontal">
            <div className="form-group">
                <div className="col-xs-12">
                    <a className="btn btn-danger"
                        onClick={ e => this.props.removeActiveTween() }
                        title="shortcut: Del">Remove</a>
                    &nbsp;
                    <a className="btn btn-primary"
                        onClick={ e => this.props.cloneActiveTween() }
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
    data: Animation
    onChange: (data: Animation) => void
    removeActiveAnimation: () => void
    cloneActiveAnimation: () => void
    addTween: () => void
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
            }[this.props.data.animType] || { }

        return <form className="form-horizontal">
            <div className="form-group">
                <div className="col-xs-12">
                    <a className="btn btn-danger"
                        onClick={ e => this.props.removeActiveAnimation() }
                        title="shortcut: Del">Remove</a>
                    &nbsp;
                    <a className="btn btn-primary"
                        onClick={ e => this.props.cloneActiveAnimation() }
                        title="shortcut: Ctrl-C">Clone</a>
                    &nbsp;
                    <a className="btn btn-default"
                        onClick={ e => this.props.addTween() }>Add Tween</a>
                </div>
            </div>
            { this.getInputs(this.commonFields) }
            { this.getInputs(fields) }
        </form>
    }
}

