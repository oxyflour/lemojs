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

const MOVETO_CONTROLLER_COLOR = '#415b76',
    LINETO_CONTROLLER_COLOR = '#48c9b0',
    CURVETO_CONTROLLER_COLOR = '#5dade2',
    CLOSEPATH_CONTROLLER_COLOR = '#ec7063'

class PathMoveToController extends React.Component<{
    data: SVGPathData.CommandMoveTo,
    onChange: (data: SVGPathData.CommandMoveTo) => void,
    onStart?: () => void,
    onEnd?: () => void,
    onDoubleClick?: () => void,
}, {}> {
    render() {
        var cmd = this.props.data
        return <Slider valueX={ cmd.x } valueY={ cmd.y }
            onChange={ (x, y) => this.props.onChange($.extend(cmd, { x, y })) }
            onStart={ (x, y) => this.props.onStart && this.props.onStart() }
            onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
            onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
            title="drag to change start point"
            style={$.extend({ left:cmd.x, top:cmd.y, background:MOVETO_CONTROLLER_COLOR }, POINT_CONTROLLER_STYLE)} />
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
        var cmd = this.props.data
        return <Slider valueX={ cmd.x } valueY={ cmd.y }
            onChange={ (x, y) => this.props.onChange($.extend(cmd, { x, y })) }
            onStart={ (x, y) => this.props.onStart && this.props.onStart() }
            onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
            onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
            title="drag to change end point"
            style={$.extend({ left:cmd.x, top:cmd.y, background:LINETO_CONTROLLER_COLOR }, POINT_CONTROLLER_STYLE)} />
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
        var cmd = this.props.data
        return <div>
            <Slider valueX={ cmd.x } valueY={ cmd.y }
                onChange={ (x, y) => this.props.onChange($.extend(cmd, { x, y })) }
                onStart={ (x, y) => this.props.onStart && this.props.onStart() }
                onEnd={ (x, y) => this.props.onEnd && this.props.onEnd() }
                onDoubleClick={ (e) => this.props.onDoubleClick && this.props.onDoubleClick() }
                title="drag to change end point"
                style={$.extend({ left:cmd.x, top:cmd.y, background:CURVETO_CONTROLLER_COLOR }, POINT_CONTROLLER_STYLE)} />
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

class PathCloseController extends React.Component<{
    cmds: SVGPathData.Command[],
    index: number,
    onDoubleClick?: () => void,
}, {}> {
    render() {
        var { index, cmds } = this.props,
            left = -10, top = -10,
            begin, end = cmds[index - 1] as any

        for (var i = index - 2; i >= 0; i --) {
            // get begin point
            var type = cmds[i].type
            if (type === SVGPathData.MOVE_TO || type === SVGPathData.CLOSE_PATH) {
                begin = cmds[i]
                break
            }
        }

        if (begin && end && begin !== end &&
            begin.x !== undefined && end.x !== undefined) {
            left = (begin.x + end.x) / 2
            top = (begin.y + end.y) / 2
        }

        return <span
            style={$.extend({ left, top, cursor:'pointer', background:CLOSEPATH_CONTROLLER_COLOR }, POINT_CONTROLLER_STYLE)}
            title="double click to delete"
            onDoubleClick={ e => this.props.onDoubleClick() }
            onMouseDown={ e => e.preventDefault() } />
    }
}

const commandControllers = {
    [SVGPathData.MOVE_TO]:  PathMoveToController,
    [SVGPathData.LINE_TO]:  PathLineToController,
    [SVGPathData.CURVE_TO]: PathCurveToController,
    [SVGPathData.CLOSE_PATH]: PathCloseController,
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
                var lastCmd = cmds[cmds.length - 2] as any,
                    cx = (cmd.x + lastCmd.x) / 2, cy = (cmd.y + lastCmd.y) / 2
                cmd.x1 = cx; cmd.y1 = cy - 20
                cmd.x2 = cx; cmd.y2 = cy + 20
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

        var curveHelpers = [ ],
            lastCmd = null
        if (cmds) cmds.forEach(cmd => {
            if (cmd.type === SVGPathData.CURVE_TO) curveHelpers.push(
                'M' + cmd.x + ',' + cmd.y + ' ' + 'L' + cmd.x1 + ',' + cmd.y1,
                'M' + lastCmd.x + ',' + lastCmd.y + ' ' + 'L' + cmd.x2 + ',' + cmd.y2)
            lastCmd = cmd
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
                React.createElement(commandControllers[cmd.type], {
                    data: cmd, cmds, index,
                    onChange: () => this.props.onChange(SVGPathData.encode(cmds)),
                    onDoubleClick: () => this.props.onChange(SVGPathData.encode(cmds.filter(c => c !== cmd))),
                })
            )}
            <div style={{ position:'absolute' }}>
                <Slider style={ TOOLBAR_BTN_STYLE } title="drag to add controller" valueX={ 0 } valueY={ 0 }
                    onChange={ (x, y) => this.updateLastCmd(x, y) }
                    onStart={ (x, y, e) => this.attachCmds(cmds, SVGPathData.MOVE_TO, e) }>
                    <span style={{ color:MOVETO_CONTROLLER_COLOR }}>M</span>
                </Slider>
                <Slider style={ TOOLBAR_BTN_STYLE } title="drag to add controller" valueX={ 0 } valueY={ 0 }
                    onChange={ (x, y) => this.updateLastCmd(x, y) }
                    onStart={ (x, y, e) => this.attachCmds(cmds, SVGPathData.LINE_TO, e) }>
                    <span style={{ color:LINETO_CONTROLLER_COLOR }}>L</span>
                </Slider>
                <Slider style={ TOOLBAR_BTN_STYLE } title="drag to add controller" valueX={ 0 } valueY={ 0 }
                    onChange={ (x, y) => this.updateLastCmd(x, y) }
                    onStart={ (x, y, e) => this.attachCmds(cmds, SVGPathData.CURVE_TO, e) }>
                    <span style={{ color:CURVETO_CONTROLLER_COLOR }}>C</span>
                </Slider>
                <span style={ TOOLBAR_BTN_STYLE }
                    onMouseDown={ e => this.attachCmds(cmds, SVGPathData.CLOSE_PATH, e) }>
                    <span style={{ color:CLOSEPATH_CONTROLLER_COLOR, cursor:'pointer' }}>Z</span>
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
