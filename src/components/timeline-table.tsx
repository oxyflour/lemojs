/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { AnimObject, AnimNode } from '../timeline'

import { Slider } from './slider'

import { debounce, clone } from '../utils'

// TODO: emit to css
// https://github.com/js-next/react-style/pull/132
const TIMELINE_TABLE_STYLE = {
     position: 'relative',
     overflow: 'auto',
     height: '100%',
}

const TIMELINE_CURSOR_STYLE = {
    position: 'absolute',
    borderRight: '3px solid #333',
    height: '100%',
}

const TIMELINE_ROWCONTAINER_STYLE = {
    height: '100%',
    outline: 'none !important',
}

const TIMELINE_ROW_STYLE = {
    padding: '0.2em 0',
    whiteSpace: 'nowrap',
}

const TIMELINE_ROWHEADER_STYLE = {
    display: 'inline-block',
    cursor: 'pointer',
    width: 120,
}

const TIMELINE_NODE_STYLE = {
    display: 'inline-block',
    background: '#eee',
    border: 'solid 2px transparent',
    borderRight: 'none',
}

const TIMELINE_MOVE_NODE_STYLE = {
    display: 'block',
    width: '100%',
}

const TIMELINE_SCALE_NODE_STYLE = {
    display: 'block',
    float: 'right',
    width: 8,
    borderRight: '3px solid #aaa',
}

const TIMELINE_ADD_NODE_STYLE = {
    paddingLeft: '1em',
    paddingRight: '1em',
    background: '#eee',
    cursor: 'pointer',
    display: 'inline-block',
    border: 'solid 2px transparent',
}

export class TimelineTable extends React.Component<{
    timeline: AnimObject[]
    onTimelineChange: (timeline: AnimObject[]) => void

    cursorPosition: number
    onCursorChange: (cursorPosition: number) => void

    activeNode: AnimNode
    onActiveNodeChange: (activeNode: AnimNode) => void
    onActiveAnimChange: (actionAnim: AnimObject) => void

    onNodeUpdated: (node: AnimNode, update: any) => void
    addAnimNode: (anim: AnimObject) => void

    duration: number

    ref: string
}, {}> {
    lastFrameScale = 0

    state = {
        frameScale: 0.1,
    }

    updateCursorDebounced = debounce(() => {
        var { cursor, rows } = this.refs
        $(cursor).parent().css('min-height', $(rows)[0].scrollHeight)
    }, 50)

    //

    rescaleFrame(factor) {
        this.setState({ frameScale: this.state.frameScale * factor })
    }

    updateScroll(oldScale: number, newScale: number) {
        if (!oldScale) return
        var elem = $(this.refs['table']),
            scrollLeft = elem.scrollLeft(),
            delta = (newScale - oldScale) * this.props.cursorPosition
        elem.scrollLeft(scrollLeft + delta)
        // dirty hack for chrome
        setTimeout(() => elem.scrollLeft(scrollLeft + delta), 0)
    }

    //

    startRowSortting(index: number, e: React.MouseEvent) {
        $(this.refs['rows']).simpleDraggable(pos => {
            var list = this.props.timeline.slice()
            if (pos >= 0 && pos < index)
                list.splice(pos, 0, list.splice(index, 1)[0])
            else if (pos > index + 1)
                list.splice(pos - 1, 0, list.splice(index, 1)[0])
            this.props.onTimelineChange(list)
        }, e as any as JQueryEventObject)
        e.stopPropagation()
    }

    renderRow(anim: AnimObject, index: number) {
        var isActive = anim.nodes.indexOf(this.props.activeNode) >= 0,
            fontWeight = isActive ? 'bold' : 'normal'
        return <div style={ TIMELINE_ROW_STYLE } key={ index }>
            <div style={ TIMELINE_ROWHEADER_STYLE }
                onClick={ e => this.props.onActiveAnimChange(anim) }
                onMouseDown={ e => this.startRowSortting(index, e) }>
                <span className="text-primary"
                    style={{ fontWeight }}>{ anim.name }</span>
            </div>
            { anim.nodes.map((node, index) => this.renderNode(node, index)) }
            { isActive && <span style={ TIMELINE_ADD_NODE_STYLE }
                onClick={ e => this.props.addAnimNode(anim) }>+</span> }
        </div>
    }

    renderNode(node: AnimNode, index: number) {
        var frameScale = this.state.frameScale,
            width = node.duration * frameScale,
            marginLeft = node.delay * frameScale,
            borderColor = this.props.activeNode === node ? '#aaa' : 'transparent'
        return <div style={ clone(TIMELINE_NODE_STYLE, { width, marginLeft, borderColor }) }>
            <Slider
                valueX={ node.duration }
                valueY={ 0 }
                range={{ minX:TIMELINE_SCALE_NODE_STYLE.width / frameScale }}
                scale={ 1 / frameScale }
                style={ TIMELINE_SCALE_NODE_STYLE }
                openHandCursor="ew-resize"
                onChange={ (x, y) => this.props.onNodeUpdated(node, { duration:x }) }>&nbsp;</Slider>
            <Slider
                valueX={ node.delay }
                valueY={ 0 }
                range={{ minX:0 }}
                scale={ 1 / frameScale }
                style={ TIMELINE_MOVE_NODE_STYLE }
                tooltip={ node.delay + ' : ' + node.duration }
                onStart={ (x, y) => this.props.onActiveNodeChange(node) }
                onChange={ (x, y) => this.props.onNodeUpdated(node, { delay:x }) }>&nbsp;</Slider>
        </div>
    }

    renderCursor() {
        var frameScale = this.state.frameScale,
            left = this.props.cursorPosition * frameScale,
            marginLeft = TIMELINE_ROWHEADER_STYLE.width

        this.updateCursorDebounced()
        return <Slider
            valueX={ this.props.cursorPosition }
            valueY={ 0 }
            range={{ minX:0 }}
            scale={ 1 / frameScale }
            openHandCursor="ew-resize"
            style={ clone(TIMELINE_CURSOR_STYLE, { left, marginLeft }) }
            tooltip={ '' + this.props.cursorPosition }
            onChange={ (x, y) => this.props.onCursorChange(x) }>
            <span ref="cursor"></span>
        </Slider>
    }

    render() {
        if (this.lastFrameScale !== this.state.frameScale)
            this.updateScroll(this.lastFrameScale, this.lastFrameScale = this.state.frameScale)

        var minWidth = TIMELINE_ROWHEADER_STYLE.width + this.state.frameScale * (this.props.duration + 1)
        return <div ref="table" style={ TIMELINE_TABLE_STYLE }>
            { this.renderCursor() }
            <div ref="rows" style={ clone(TIMELINE_ROWCONTAINER_STYLE, { minWidth }) } tabIndex={ -1 }>
                { this.props.timeline.map((anim, index) => this.renderRow(anim, index)) }
            </div>
        </div>
    }
}
