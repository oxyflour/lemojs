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

const TOOLBAR_BTN_STYLE = {
    padding: '0.8em 0.2em',
    margin: '0.2em',
    cursor: 'pointer',
}

const POINT_CONTROLLER_STYLE = {
    position: 'absolute',
    width: 16,
    height: 16,
    marginLeft: -8,
    marginTop: -8,
    opacity: 0.5,
    borderRadius: 4,
}

function findLastItemWith(cmds: any[], index: number, fn: string | ((...args) => boolean)) {
    var func = typeof fn === 'function' ?
        fn :
        x => x[fn] !== undefined
    for (var i = index - 1; i >= 0; i --)
        if (func(cmds[i], i))
            return cmds[i]
}

class PathMoveToController extends React.Component<{
    data: SVGPathData.CommandMoveTo,
    onChange: (data: SVGPathData.CommandMoveTo) => void,
    onStart?: () => void,
    onEnd?: () => void,
    onDoubleClick?: () => void,
}, {}> {
    render() {
        var cmd = this.props.data,
            background = SVG_CURVE_PARAMS[cmd['type']].color
        return <Slider valueX={ cmd.x } valueY={ cmd.y }
            onChange={ (x, y) => this.props.onChange($.extend(cmd, { x, y })) }
            onStart={ (x, y) => this.props.onStart && this.props.onStart() }
            onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
            onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
            title="drag to change start point"
            style={$.extend({ left:cmd.x, top:cmd.y, background }, POINT_CONTROLLER_STYLE)} />
    }
}

class PathLineToController extends React.Component<{
    data: SVGPathData.CommandLineTo,
    onChange: (data: SVGPathData.CommandLineTo) => void,
    onStart: () => void,
    onEnd: () => void,
    onDoubleClick?: () => void,
}, {}> {
    render() {
        var cmd = this.props.data,
            background = SVG_CURVE_PARAMS[cmd['type']].color
        return <Slider valueX={ cmd.x } valueY={ cmd.y }
            onChange={ (x, y) => this.props.onChange($.extend(cmd, { x, y })) }
            onStart={ (x, y) => this.props.onStart && this.props.onStart() }
            onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
            onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
            title="drag to change end point"
            style={$.extend({ left:cmd.x, top:cmd.y, background }, POINT_CONTROLLER_STYLE)} />
    }
}

class PathHLineToController extends React.Component<{
    data: SVGPathData.CommandLineTo,
    cmds: SVGPathData.Command[],
    index: number,
    onChange: (data: SVGPathData.CommandLineTo) => void,
    onStart: () => void,
    onEnd: () => void,
    onDoubleClick?: () => void,
}, {}> {
    render() {
        var cmd = this.props.data,
            background = SVG_CURVE_PARAMS[cmd['type']].color
        var prev = findLastItemWith(this.props.cmds, this.props.index, 'y'),
            posY = (prev || cmd).y
        return <Slider valueX={ cmd.x } valueY={ posY }
            onChange={ (x, y) => this.props.onChange($.extend(cmd, { x })) }
            onStart={ (x, y) => this.props.onStart && this.props.onStart() }
            onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
            onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
            title="drag to change end point"
            style={$.extend({ left:cmd.x, top:posY, background }, POINT_CONTROLLER_STYLE)} />
    }
}

class PathVLineToController extends React.Component<{
    data: SVGPathData.CommandLineTo,
    cmds: SVGPathData.Command[],
    index: number,
    onChange: (data: SVGPathData.CommandLineTo) => void,
    onStart: () => void,
    onEnd: () => void,
    onDoubleClick?: () => void,
}, {}> {
    render() {
        var cmd = this.props.data,
            background = SVG_CURVE_PARAMS[cmd['type']].color
        var prev = findLastItemWith(this.props.cmds, this.props.index, 'x'),
            posX = (prev || cmd).x
        return <Slider valueX={ posX } valueY={ cmd.y }
            onChange={ (x, y) => this.props.onChange($.extend(cmd, { y })) }
            onStart={ (x, y) => this.props.onStart && this.props.onStart() }
            onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
            onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
            title="drag to change end point"
            style={$.extend({ left:posX, top:cmd.y, background }, POINT_CONTROLLER_STYLE)} />
    }
}

class PathCurveToController extends React.Component<{
    data: SVGPathData.CommandCurveTo,
    onChange: (data: SVGPathData.CommandCurveTo) => void,
    onStart?: () => void,
    onEnd?: () => void,
    onDoubleClick?: () => void,
}, {}> {
    render() {
        var cmd = this.props.data,
            background = SVG_CURVE_PARAMS[cmd['type']].color
        return <div>
            <Slider valueX={ cmd.x } valueY={ cmd.y }
                onChange={ (x, y) => this.props.onChange($.extend(cmd, { x, y })) }
                onStart={ (x, y) => this.props.onStart && this.props.onStart() }
                onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
                onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
                title="drag to change end point"
                style={$.extend({ left:cmd.x, top:cmd.y, background }, POINT_CONTROLLER_STYLE)} />
            <Slider valueX={ cmd.x1 } valueY={ cmd.y1 }
                onChange={ (x1, y1) => this.props.onChange($.extend(cmd, { x1, y1 })) }
                onStart={ (x, y) => this.props.onStart && this.props.onStart() }
                onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
                onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
                title="drag to change curve"
                style={$.extend({ left:cmd.x1, top:cmd.y1, border:'1px solid black' },
                    POINT_CONTROLLER_STYLE)} />
            <Slider valueX={ cmd.x2 } valueY={ cmd.y2 }
                onChange={ (x2, y2) => this.props.onChange($.extend(cmd, { x2, y2 })) }
                onStart={ (x, y) => this.props.onStart && this.props.onStart() }
                onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
                onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
                title="drag to change curve"
                style={$.extend({ left:cmd.x2, top:cmd.y2, border:'1px solid black' },
                    POINT_CONTROLLER_STYLE)} />
        </div>
    }
}

class PathSCurveToController extends React.Component<{
    data: SVGPathData.CommandCurveTo,
    onChange: (data: SVGPathData.CommandCurveTo) => void,
    onStart?: () => void,
    onEnd?: () => void,
    onDoubleClick?: () => void,
}, {}> {
    render() {
        var cmd = this.props.data,
            background = SVG_CURVE_PARAMS[cmd['type']].color
        return <div>
            <Slider valueX={ cmd.x } valueY={ cmd.y }
                onChange={ (x, y) => this.props.onChange($.extend(cmd, { x, y })) }
                onStart={ (x, y) => this.props.onStart && this.props.onStart() }
                onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
                onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
                title="drag to change end point"
                style={$.extend({ left:cmd.x, top:cmd.y, background }, POINT_CONTROLLER_STYLE)} />
            <Slider valueX={ cmd.x2 } valueY={ cmd.y2 }
                onChange={ (x2, y2) => this.props.onChange($.extend(cmd, { x2, y2 })) }
                onStart={ (x, y) => this.props.onStart && this.props.onStart() }
                onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
                onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
                title="drag to change curve"
                style={$.extend({ left:cmd.x2, top:cmd.y2, border:'1px solid black' },
                    POINT_CONTROLLER_STYLE)} />
        </div>
    }
}

class PathQCurveToController extends React.Component<{
    data: SVGPathData.CommandCurveTo,
    onChange: (data: SVGPathData.CommandCurveTo) => void,
    onStart?: () => void,
    onEnd?: () => void,
    onDoubleClick?: () => void,
}, {}> {
    render() {
        var cmd = this.props.data,
            background = SVG_CURVE_PARAMS[cmd['type']].color
        return <div>
            <Slider valueX={ cmd.x } valueY={ cmd.y }
                onChange={ (x, y) => this.props.onChange($.extend(cmd, { x, y })) }
                onStart={ (x, y) => this.props.onStart && this.props.onStart() }
                onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
                onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
                title="drag to change end point"
                style={$.extend({ left:cmd.x, top:cmd.y, background }, POINT_CONTROLLER_STYLE)} />
            <Slider valueX={ cmd.x1 } valueY={ cmd.y1 }
                onChange={ (x1, y1) => this.props.onChange($.extend(cmd, { x1, y1 })) }
                onStart={ (x, y) => this.props.onStart && this.props.onStart() }
                onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
                onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
                title="drag to change curve"
                style={$.extend({ left:cmd.x1, top:cmd.y1, border:'1px solid black' },
                    POINT_CONTROLLER_STYLE)} />
        </div>
    }
}

class PathTCurveToController extends React.Component<{
    data: SVGPathData.CommandCurveTo,
    onChange: (data: SVGPathData.CommandCurveTo) => void,
    onStart?: () => void,
    onEnd?: () => void,
    onDoubleClick?: () => void,
}, {}> {
    render() {
        var cmd = this.props.data,
            background = SVG_CURVE_PARAMS[cmd['type']].color
        return <Slider valueX={ cmd.x } valueY={ cmd.y }
            onChange={ (x, y) => this.props.onChange($.extend(cmd, { x, y })) }
            onStart={ (x, y) => this.props.onStart && this.props.onStart() }
            onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
            onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
            title="drag to change end point"
            style={$.extend({ left:cmd.x, top:cmd.y, background }, POINT_CONTROLLER_STYLE)} />
    }
}

class PathCloseController extends React.Component<{
    cmds: SVGPathData.Command[],
    index: number,
    onDoubleClick?: () => void,
}, {}> {
    render() {
        var { index, cmds } = this.props,
            left = -10, top = -10,
            beginIndex = -1,
            endIndex = index

        findLastItemWith(cmds, index, (c, i) => {
            beginIndex = i + 1
            return c.type === SVGPathData.MOVE_TO || c.type == SVGPathData.CLOSE_PATH
        })

        var bx = findLastItemWith(cmds, beginIndex, 'x'),
            by = findLastItemWith(cmds, beginIndex, 'y'),
            ex = findLastItemWith(cmds, endIndex, 'x'),
            ey = findLastItemWith(cmds, endIndex, 'y')
        if (bx && by && ex && ey) {
            left = (bx.x + ex.x) / 2
            top = (by.y + ey.y) / 2
        }

        var background = SVG_CURVE_PARAMS[SVGPathData.CLOSE_PATH].color
        return <span
            style={$.extend({ left, top, cursor:'pointer', background }, POINT_CONTROLLER_STYLE)}
            title="double click to delete"
            onDoubleClick={ e => this.props.onDoubleClick() }
            onMouseDown={ e => e.preventDefault() } />
    }
}

const SVG_CURVE_PARAMS: {
    [type: string]: {
        command: string,
        controller: React.ComponentClass<any>,
        color: string
    }
} = {
    [SVGPathData.MOVE_TO]: {
        command: 'M',
        controller: PathMoveToController,
        color: '#415b76',
    },
    [SVGPathData.LINE_TO]: {
        command: 'L',
        controller: PathLineToController,
        color: '#48c9b0',
    },
    [SVGPathData.HORIZ_LINE_TO]: {
        command: 'H',
        controller: PathHLineToController,
        color: '#48c9b0',
    },
    [SVGPathData.VERT_LINE_TO]: {
        command: 'V',
        controller: PathVLineToController,
        color: '#48c9b0',
    },
    [SVGPathData.CURVE_TO]: {
        command: 'C',
        controller: PathCurveToController,
        color: '#5dade2',
    },
    [SVGPathData.SMOOTH_CURVE_TO]: {
        command: 'S',
        controller: PathSCurveToController,
        color: '#5dade2',
    },
    [SVGPathData.QUAD_TO]: {
        command: 'Q',
        controller: PathQCurveToController,
        color: '#5dade2',
    },
    [SVGPathData.SMOOTH_QUAD_TO]: {
        command: 'T',
        controller: PathTCurveToController,
        color: '#5dade2',
    },
    [SVGPathData.CLOSE_PATH]: {
        command: 'Z',
        controller: PathCloseController,
        color: '#ec7063',
    },
}

export class PathEditor extends React.Component<{
    data: string,
    onChange: (data: string) => void,
}, { }> {
    attachedPath: string
    attachedCmds: SVGPathData.Command[]
    attachedPos: { x:number, y:number }

    attachCmds(cmds: SVGPathData.Command[], type: any, e: React.MouseEvent) {
        var offset = $(this.refs['content']).offset(),
            cmd = { type:type, x:e.pageX - offset.left, y:e.pageY - offset.top } as any
        cmds = cmds.concat(cmd)

        this.attachedCmds = cmds
        this.attachedPos = { x:cmd.x, y:cmd.y }
        this.updateLastCmd(0, 0)

        e.preventDefault()
    }

    updateLastCmd(x: number, y: number) {
        var cmds = this.attachedCmds,
            cmd = cmds && cmds[cmds.length - 1] as any
        if (cmd && this.attachedPos) {
            cmd.x = x + this.attachedPos.x
            cmd.y = y + this.attachedPos.y

            if (cmd.type === SVGPathData.CURVE_TO) {
                var px = findLastItemWith(cmds, cmds.length - 1, 'x'),
                    py = findLastItemWith(cmds, cmds.length - 1, 'y'),
                    cx = (cmd.x + px.x) / 2, cy = (cmd.y + py.y) / 2
                cmd.x1 = cx; cmd.y1 = cy - 20
                cmd.x2 = cx; cmd.y2 = cy + 20
            }
            else if (cmd.type === SVGPathData.SMOOTH_CURVE_TO) {
                var px = findLastItemWith(cmds, cmds.length - 1, 'x'),
                    py = findLastItemWith(cmds, cmds.length - 1, 'y')
                cmd.x2 = (cmd.x + px.x) / 2
                cmd.y2 = (cmd.y + py.y) / 2
            }
            else if (cmd.type === SVGPathData.QUAD_TO) {
                var px = findLastItemWith(cmds, cmds.length - 1, 'x'),
                    py = findLastItemWith(cmds, cmds.length - 1, 'y')
                cmd.x1 = (cmd.x + px.x) / 2
                cmd.y1 = (cmd.y + py.y) / 2
            }

            this.props.onChange(SVGPathData.encode(this.attachedCmds))
        }
    }

    render() {
        if (typeof this.props.data !== 'string')
            return <div />

        var cmds = [ ]
        try {
            cmds = new SVGPathData(this.props.data).toAbs().commands
        }
        catch (e) {
            console.warn('the given data is not a valid svg path')
        }

        var curveHelpers = [ ]
        if (cmds) cmds.forEach((cmd, index) => {
            if (cmd.type === SVGPathData.CURVE_TO) {
                var px = findLastItemWith(cmds, index, 'x'),
                    py = findLastItemWith(cmds, index, 'y')
                if (px && py) curveHelpers.push(
                    'M' + cmd.x + ',' + cmd.y + ' ' + 'L' + cmd.x1 + ',' + cmd.y1,
                    'M' + px.x + ',' + py.y + ' ' + 'L' + cmd.x2 + ',' + cmd.y2)
            }
            else if (cmd.type === SVGPathData.SMOOTH_CURVE_TO) {
                var px = findLastItemWith(cmds, index, 'x'),
                    py = findLastItemWith(cmds, index, 'y')
                if (px && py) curveHelpers.push(
                    'M' + cmd.x + ',' + cmd.y + ' ' + 'L' + cmd.x2 + ',' + cmd.y2,
                    'M' + px.x + ',' + py.y + ' ' + 'L' + cmd.x2 + ',' + cmd.y2)
            }
            else if (cmd.type === SVGPathData.QUAD_TO) {
                var px = findLastItemWith(cmds, index, 'x'),
                    py = findLastItemWith(cmds, index, 'y')
                if (px && py) curveHelpers.push(
                    'M' + cmd.x + ',' + cmd.y + ' ' + 'L' + cmd.x1 + ',' + cmd.y1,
                    'M' + px.x + ',' + py.y + ' ' + 'L' + cmd.x1 + ',' + cmd.y1)
            }
        })

        return <div ref="content" style={ EDITOR_CONTENT_STYLE }>
            <svg style={{ position:'absolute', width:'100%', height:'100%' }}
                onMouseDown={ e => e.preventDefault() }>
                <path d={ cmds ? this.props.data : '' }
                    fill="none" stroke="black" strokeWidth="3" strokeDasharray="10 10" />
                { curveHelpers.map(d =>
                    <path d={ d } fill="none" stroke="#555555" strokeWidth="1" />
                ) }
            </svg>
            { cmds && cmds.map((cmd, index) =>
                React.createElement(SVG_CURVE_PARAMS[cmd.type].controller, {
                    data: cmd,
                    key: index,
                    cmds, index,
                    onChange: () => this.props.onChange(SVGPathData.encode(cmds)),
                    onDoubleClick: () => this.props.onChange(SVGPathData.encode(cmds.filter(c => c !== cmd))),
                })
            )}
            <div style={{ position:'absolute' }}>
                { [
                    SVGPathData.MOVE_TO,
                    SVGPathData.LINE_TO,
                    SVGPathData.HORIZ_LINE_TO,
                    SVGPathData.VERT_LINE_TO,
                    SVGPathData.CURVE_TO,
                    SVGPathData.SMOOTH_CURVE_TO,
                    SVGPathData.QUAD_TO,
                    SVGPathData.SMOOTH_QUAD_TO,
                ].map((type, index) => {
                    var { color, command } = SVG_CURVE_PARAMS[type]
                    return <Slider style={ TOOLBAR_BTN_STYLE } title="drag to add controller"
                        valueX={ 0 } valueY={ 0 } key={ index }
                        onChange={ (x, y) => this.updateLastCmd(x, y) }
                        onStart={ (x, y, e) => this.attachCmds(cmds, type, e) }>
                        <span style={{ color }}>{ command }</span>
                    </Slider>
                }) }
                <span style={ TOOLBAR_BTN_STYLE }
                    onMouseDown={ e => this.attachCmds(cmds, SVGPathData.CLOSE_PATH, e) }>
                    <span style={{ color:SVG_CURVE_PARAMS[SVGPathData.CLOSE_PATH].color, cursor:'pointer' }}>Z</span>
                </span>
            </div>
            <div style={{ position:'absolute', right:0 }}>
                <Slider style={ TOOLBAR_BTN_STYLE }
                    title="drag to translate path" valueX={ 0 } valueY={ 0 }
                    onChange={ (x, y) => this.attachedPath &&
                        this.props.onChange(new SVGPathData(this.attachedPath).translate(x, y).encode()) }
                    onStart={ (x, y, e) => this.attachedPath = this.props.data }>
                    @
                </Slider>
                <Slider style={ TOOLBAR_BTN_STYLE }
                    title="drag to rescale path"
                    valueX={ 1 } valueY={ 1 } step={ 0.1 } scale={ 0.1 }
                    range={{ minX:0.1, minY:0.1, maxX:2, maxY:2 }}
                    onChange={ (x, y) => this.attachedPath &&
                        this.props.onChange(new SVGPathData(this.attachedPath).scale(x, y).encode()) }
                    onStart={ (x, y, e) => this.attachedPath = this.props.data }>
                    #
                </Slider>
            </div>
        </div>
    }
}
