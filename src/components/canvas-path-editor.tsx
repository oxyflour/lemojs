/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../typings/svg-pathdata.d.ts"/>

import * as React from 'react'
import * as $ from 'jquery'

import { Slider } from './slider'

import * as SVGPathData from 'svg-pathdata'

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

const SVG_CONTROLLER_COLOR = {
    [SVGPathData.MOVE_TO]:          '#415b76',
    [SVGPathData.LINE_TO]:          '#48c9b0',
    [SVGPathData.HORIZ_LINE_TO]:    '#48c9b0',
    [SVGPathData.VERT_LINE_TO]:     '#48c9b0',
    [SVGPathData.CURVE_TO]:         '#5dade2',
    [SVGPathData.SMOOTH_CURVE_TO]:  '#5dade2',
    [SVGPathData.QUAD_TO]:          '#f4d313',
    [SVGPathData.SMOOTH_QUAD_TO]:   '#f4d313',
    [SVGPathData.CLOSE_PATH]:       '#ec7063',
}

const SVG_COMMAND_MAP = {
    M: SVGPathData.MOVE_TO,
    L: SVGPathData.LINE_TO,
    H: SVGPathData.HORIZ_LINE_TO,
    V: SVGPathData.VERT_LINE_TO,
    C: SVGPathData.CURVE_TO,
    S: SVGPathData.SMOOTH_CURVE_TO,
    Q: SVGPathData.QUAD_TO,
    T: SVGPathData.SMOOTH_QUAD_TO,
    Z: SVGPathData.CLOSE_PATH,
}

function findLastItemWith(cmds: any[], index: number, fn: string | ((...args) => boolean)) {
    var func = typeof fn === 'string' ? ((x, i) => x[fn] !== undefined) : fn
    for (var i = index - 1; i >= 0; i --)
        if (func(cmds[i], i))
            return cmds[i]
}

export class PathEditor extends React.Component<{
    data: string,
    onChange: (data: string) => void,
    onClose: () => void,
}, { }> {
    attachedPath: string
    attachedCmds: SVGPathData.Command[]
    attachedPos: { x:number, y:number }

    attachCmds(cmds: SVGPathData.Command[], type: any, e: React.MouseEvent) {
        var offset = $(this.refs['content']).offset(),
            cmd = { type:type, x:e.pageX - offset.left, y:e.pageY - offset.top } as any

        if (cmd.type === SVGPathData.CLOSE_PATH) {
            var prev = cmds[cmds.length - 1]
            if (!prev || prev.type === SVGPathData.CLOSE_PATH)
                return e.preventDefault()
        }

        this.attachedCmds = cmds.concat(cmd)
        this.attachedPos = { x:cmd.x, y:cmd.y }
        this.updateLastCmd(0, 0)

        e.preventDefault()
    }

    updateLastCmd(x: number, y: number) {
        var cmds = this.attachedCmds,
            cmd = cmds && cmds[cmds.length - 1] as any

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

    renderController(cmds: SVGPathData.Command[], index: number) {
        var cmd = cmds[index] as any,
            background = SVG_CONTROLLER_COLOR[cmd.type]

        if (cmd.type === SVGPathData.MOVE_TO) {
            return <Slider valueX={ cmd.x } valueY={ cmd.y }
                onChange={ (x, y) => $.extend(cmd, { x, y }) && this.props.onChange(SVGPathData.encode(cmds)) }
                onDoubleClick={ (e) => this.props.onChange(SVGPathData.encode(cmds.filter(c => c !== cmd))) }
                title="drag to change start point\ndouble click to delete"
                tooltip={ cmd.x + ', ' + cmd.y }
                style={$.extend({ left:cmd.x, top:cmd.y, background }, POINT_CONTROLLER_STYLE)} />
        }
        else if (cmd.type === SVGPathData.LINE_TO) {
            return <Slider valueX={ cmd.x } valueY={ cmd.y }
                onChange={ (x, y) => $.extend(cmd, { x, y }) && this.props.onChange(SVGPathData.encode(cmds)) }
                onDoubleClick={ (e) => this.props.onChange(SVGPathData.encode(cmds.filter(c => c !== cmd))) }
                title="drag to change end point\ndouble click to delete"
                tooltip={ cmd.x + ', ' + cmd.y }
                style={$.extend({ left:cmd.x, top:cmd.y, background }, POINT_CONTROLLER_STYLE)} />
        }
        else if (cmd.type === SVGPathData.HORIZ_LINE_TO) {
            var prev = findLastItemWith(cmds, index, 'y'),
                posY = (prev || cmd).y
            return <Slider valueX={ cmd.x } valueY={ posY }
                onChange={ (x, y) => $.extend(cmd, { x }) && this.props.onChange(SVGPathData.encode(cmds)) }
                onDoubleClick={ (e) => this.props.onChange(SVGPathData.encode(cmds.filter(c => c !== cmd))) }
                title="drag to change end point\ndouble click to delete"
                tooltip={ cmd.x + ', ' + posY }
                style={$.extend({ left:cmd.x, top:posY, background,
                    borderTop:'2px solid black', borderBottom: '2px solid black' }, POINT_CONTROLLER_STYLE)} />
        }
        else if (cmd.type === SVGPathData.VERT_LINE_TO) {
            var prev = findLastItemWith(cmds, index, 'x'),
                posX = (prev || cmd).x
            return <Slider valueX={ posX } valueY={ cmd.y }
                onChange={ (x, y) => $.extend(cmd, { y }) && this.props.onChange(SVGPathData.encode(cmds)) }
                onDoubleClick={ (e) => this.props.onChange(SVGPathData.encode(cmds.filter(c => c !== cmd))) }
                title="drag to change end point\ndouble click to delete"
                tooltip={ posX + ', ' + cmd.y }
                style={$.extend({ left:posX, top:cmd.y, background,
                    borderLeft:'2px solid black', borderRight: '2px solid black' }, POINT_CONTROLLER_STYLE)} />
        }
        else if (cmd.type === SVGPathData.CURVE_TO) {
            return <div>
                <Slider valueX={ cmd.x } valueY={ cmd.y }
                    onChange={ (x, y) => $.extend(cmd, { x, y }) && this.props.onChange(SVGPathData.encode(cmds)) }
                    onDoubleClick={ (e) => this.props.onChange(SVGPathData.encode(cmds.filter(c => c !== cmd))) }
                    title="drag to change end point\ndouble click to delete"
                    tooltip={ cmd.x + ', ' + cmd.y }
                    style={$.extend({ left:cmd.x, top:cmd.y, background }, POINT_CONTROLLER_STYLE)} />
                <Slider valueX={ cmd.x1 } valueY={ cmd.y1 }
                    onChange={ (x1, y1) => $.extend(cmd, { x1, y1 }) && this.props.onChange(SVGPathData.encode(cmds)) }
                    title="drag to change curve"
                    tooltip={ cmd.x1 + ', ' + cmd.y1 }
                    style={$.extend({ left:cmd.x1, top:cmd.y1, border:'2px solid black' }, POINT_CONTROLLER_STYLE)} />
                <Slider valueX={ cmd.x2 } valueY={ cmd.y2 }
                    onChange={ (x2, y2) => $.extend(cmd, { x2, y2 }) && this.props.onChange(SVGPathData.encode(cmds)) }
                    title="drag to change curve"
                    tooltip={ cmd.x2 + ', ' + cmd.y2 }
                    style={$.extend({ left:cmd.x2, top:cmd.y2, border:'2px solid black' }, POINT_CONTROLLER_STYLE)} />
            </div>
        }
        else if (cmd.type === SVGPathData.SMOOTH_CURVE_TO) {
            return <div>
                <Slider valueX={ cmd.x } valueY={ cmd.y }
                    onChange={ (x, y) => $.extend(cmd, { x, y }) && this.props.onChange(SVGPathData.encode(cmds)) }
                    onDoubleClick={ (e) => this.props.onChange(SVGPathData.encode(cmds.filter(c => c !== cmd))) }
                    title="drag to change end point\ndouble click to delete"
                    tooltip={ cmd.x + ', ' + cmd.y }
                    style={$.extend({ left:cmd.x, top:cmd.y, background, border:'2px solid black'}, POINT_CONTROLLER_STYLE)} />
                <Slider valueX={ cmd.x2 } valueY={ cmd.y2 }
                    onChange={ (x2, y2) => $.extend(cmd, { x2, y2 }) && this.props.onChange(SVGPathData.encode(cmds)) }
                    title="drag to change curve"
                    tooltip={ cmd.x2 + ', ' + cmd.y2 }
                    style={$.extend({ left:cmd.x2, top:cmd.y2, border:'2px solid black' }, POINT_CONTROLLER_STYLE)} />
            </div>
        }
        else if (cmd.type === SVGPathData.QUAD_TO) {
            return <div>
                <Slider valueX={ cmd.x } valueY={ cmd.y }
                    onChange={ (x, y) => $.extend(cmd, { x, y }) && this.props.onChange(SVGPathData.encode(cmds)) }
                    onDoubleClick={ (e) => this.props.onChange(SVGPathData.encode(cmds.filter(c => c !== cmd))) }
                    title="drag to change end point\ndouble click to delete"
                    tooltip={ cmd.x + ', ' + cmd.y }
                    style={$.extend({ left:cmd.x, top:cmd.y, background }, POINT_CONTROLLER_STYLE)} />
                <Slider valueX={ cmd.x1 } valueY={ cmd.y1 }
                    onChange={ (x1, y1) => $.extend(cmd, { x1, y1 }) && this.props.onChange(SVGPathData.encode(cmds)) }
                    title="drag to change curve"
                    tooltip={ cmd.x1 + ', ' + cmd.y1 }
                    style={$.extend({ left:cmd.x1, top:cmd.y1, border:'2px solid black' }, POINT_CONTROLLER_STYLE)} />
            </div>
        }
        else if (cmd.type === SVGPathData.SMOOTH_QUAD_TO) {
            return <Slider valueX={ cmd.x } valueY={ cmd.y }
                onChange={ (x, y) => $.extend(cmd, { x, y }) && this.props.onChange(SVGPathData.encode(cmds)) }
                onDoubleClick={ (e) => this.props.onChange(SVGPathData.encode(cmds.filter(c => c !== cmd))) }
                title="drag to change end point"
                tooltip={ cmd.x + ', ' + cmd.y }
                style={$.extend({ left:cmd.x, top:cmd.y, background, border:'2px solid black' }, POINT_CONTROLLER_STYLE)} />
        }
        else if (cmd.type === SVGPathData.CLOSE_PATH) {
            var left = -10, top = -10,
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

            return <span
                onMouseDown={ e => e.preventDefault() }
                onDoubleClick={ (e) => this.props.onChange(SVGPathData.encode(cmds.filter(c => c !== cmd))) }
                title="double click to delete"
                style={$.extend({ left, top, background, cursor:'pointer' }, POINT_CONTROLLER_STYLE)} />
        }
        else {
            return <div />
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
                { curveHelpers.map(d => <path d={ d } fill="none" stroke="#555555" strokeWidth="1" />) }
            </svg>
            { cmds && cmds.map((c, i) => this.renderController(cmds, i))}
            <div style={{ position:'absolute' }}>
                { 'MLHVCSQTZ'.split('').map((command, index) => {
                    var type = SVG_COMMAND_MAP[command],
                        color = SVG_CONTROLLER_COLOR[type]
                    return type === SVGPathData.CLOSE_PATH ?
                    <span style={ TOOLBAR_BTN_STYLE } title="click to close path"
                        key={ index }
                        onMouseDown={ e => this.attachCmds(cmds, SVGPathData.CLOSE_PATH, e) }>
                        <span style={{ color, cursor:'pointer' }}>Z</span>
                    </span> :
                    <Slider style={ TOOLBAR_BTN_STYLE } title="drag to add controller"
                        valueX={ 0 } valueY={ 0 } key={ index }
                        onStart={ (x, y, e) => this.attachCmds(cmds, type, e) }
                        onChange={ (x, y) => this.updateLastCmd(x, y) }>
                        <span style={{ color }}>{ command }</span>
                    </Slider>
                }) }
            </div>
            <div style={{ position:'absolute', right:0 }}>
                <Slider style={ TOOLBAR_BTN_STYLE }
                    title="drag to translate path" valueX={ 0 } valueY={ 0 }
                    onChange={ (x, y) => this.attachedPath &&
                        this.props.onChange(new SVGPathData(this.attachedPath).translate(x, y).encode()) }
                    onStart={ (x, y, e) => this.attachedPath = this.props.data }>
                    @
                </Slider>
                <span style={ TOOLBAR_BTN_STYLE }
                    title="close"
                    onClick={ e => this.props.onClose() }>
                    x
                </span>
            </div>
        </div>
    }
}
