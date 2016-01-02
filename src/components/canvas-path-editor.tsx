/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../typings/svg-pathdata.d.ts"/>

import * as React from 'react'
import * as $ from 'jquery'

import { Slider } from './slider'

import SVGPathData = require('svg-pathdata')

const EDITOR_CONTENT_STYLE = {
    position: 'absolute',
    zIndex: 1001,
    width: '100%',
    height: '100%',
}

const POINT_CONTROLLER_STYLE = {
    position: 'absolute',
    width: 10,
    height: 10,
    marginLeft: -5,
    marginTop: -5,
}

class PathMoveToController extends React.Component<{
    data: SVGPathData.CommandMoveTo,
    onChange: (data: SVGPathData.CommandMoveTo) => void,
    onStart?: () => void,
    onEnd?: () => void,
}, {}> {
    render() {
        var cmd = this.props.data
        return <Slider valueX={ cmd.x } valueY={ cmd.y }
            onChange={ (x, y) => this.props.onChange($.extend(cmd, { x, y })) }
            onStart={ (x, y) => this.props.onStart && this.props.onStart() }
            onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
            style={$.extend({ left:cmd.x, top:cmd.y, background:'blue' }, POINT_CONTROLLER_STYLE)} />
    }
}

class PathLineToController extends React.Component<{
    data: SVGPathData.CommandLineTo,
    onChange: (data: SVGPathData.CommandLineTo) => void,
    onStart: () => void,
    onEnd: () => void,
}, {}> {
    render() {
        var cmd = this.props.data
        return <Slider valueX={ cmd.x } valueY={ cmd.y }
            onChange={ (x, y) => this.props.onChange($.extend(cmd, { x, y })) }
            onStart={ (x, y) => this.props.onStart && this.props.onStart() }
            onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
            style={$.extend({ left:cmd.x, top:cmd.y, background:'red' }, POINT_CONTROLLER_STYLE)} />
    }
}

class PathCurveToController extends React.Component<{
    data: SVGPathData.CommandCurveTo,
    onChange: (data: SVGPathData.CommandCurveTo) => void,
    onStart?: () => void,
    onEnd?: () => void,
}, {}> {
    render() {
        var cmd = this.props.data
        return <div>
            <Slider valueX={ cmd.x } valueY={ cmd.y }
                onChange={ (x, y) => this.props.onChange($.extend(cmd, { x, y })) }
                onStart={ (x, y) => this.props.onStart && this.props.onStart() }
                onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
                style={$.extend({ left:cmd.x, top:cmd.y, background:'black' }, POINT_CONTROLLER_STYLE)} />
            <Slider valueX={ cmd.x1 } valueY={ cmd.y1 }
                onChange={ (x1, y1) => this.props.onChange($.extend(cmd, { x1, y1 })) }
                onStart={ (x, y) => this.props.onStart && this.props.onStart() }
                onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
                style={$.extend({ left:cmd.x1, top:cmd.y1, border:'1px solid black' },
                    POINT_CONTROLLER_STYLE)} />
            <Slider valueX={ cmd.x2 } valueY={ cmd.y2 }
                onChange={ (x2, y2) => this.props.onChange($.extend(cmd, { x2, y2 })) }
                onStart={ (x, y) => this.props.onStart && this.props.onStart() }
                onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
                style={$.extend({ left:cmd.x2, top:cmd.y2, border:'1px solid black' },
                    POINT_CONTROLLER_STYLE)} />
        </div>
    }
}

const commandControllers = {
    [SVGPathData.MOVE_TO]:  PathMoveToController,
    [SVGPathData.LINE_TO]:  PathLineToController,
    [SVGPathData.CURVE_TO]: PathCurveToController,
}

export class PathEditor extends React.Component<{
    data: string,
    onChange: (data: string) => void,
}, { }> {
    state = {
        showControls: true,
    }

    render() {
        var svgPath = null
        try {
            svgPath = this.state.showControls && this.props.data && new SVGPathData(this.props.data)
        }
        catch (e) {
            console.warn('the given data is not a valid svg path')
        }

        var curveHelpers = [ ],
            lastCmd = null
        if (svgPath) svgPath.commands.forEach(cmd => {
            if (cmd.type === SVGPathData.CURVE_TO) curveHelpers.push(
                'M' + cmd.x + ',' + cmd.y + ' ' + 'L' + cmd.x1 + ',' + cmd.y1,
                'M' + lastCmd.x + ',' + lastCmd.y + ' ' + 'L' + cmd.x2 + ',' + cmd.y2)
            lastCmd = cmd
        })

        return <div style={ EDITOR_CONTENT_STYLE }>
            <label style={{ position:'absolute', cursor:'hand' }}>
                <input type="checkbox" checked={ this.state.showControls }
                    onChange={ e => this.setState({ showControls:e.target['checked'] }) } />
                show controls
            </label>
            <svg style={{ width:'100%', height:'100%' }}>
                <path d={ this.state.showControls && this.props.data }
                    fill="none" stroke="black" strokeWidth="2" />
                { curveHelpers.map(d =>
                    <path d={ d } fill="none" stroke="#555555" strokeWidth="1" />
                ) }
            </svg>
            { svgPath && svgPath.commands.map((cmd, index) =>
                React.createElement(commandControllers[cmd.type], {
                    data: cmd, commands: svgPath.commands, index,
                    onChange: () => this.props.onChange(svgPath.encode()),
                })
            ) }
        </div>
    }
}
