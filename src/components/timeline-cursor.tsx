/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { AnimNode, Timeline } from '../timeline'

// TODO: emit to css
// https://github.com/js-next/react-style/pull/132
const TIMELINE_CURSOR_STYLE = {
    position: 'absolute',
    width: 3,
    height: '100%',
    background: '#888',
    zIndex: 50,
    cursor: 'ew-resize',
    outline: 'none !important',
}

const FRAME_INTERVAL = 1000 / 60

export class TimelineCursor extends React.Component<{
    data: number,
    frameScale: number,
    marginLeft: number,
    ref: string,

    onChange: (cursor: number) => void,
    shiftTo: (cursor: number) => void,
}, {}> {
    onMouseMove = this.handleMouseMove.bind(this)
    onMouseUp = this.handleMouseUp.bind(this)

    getCursorFromMouse(e: React.MouseEvent) {
        var scrollLeft = $(e.target).parents().add(e.target as HTMLElement).get()
                .reduce((s, e) => s + $(e).scrollLeft(), 0),
            cursor = (scrollLeft + e.pageX - this.props.marginLeft) / this.props.frameScale
        return Math.max(0, Math.floor(cursor / FRAME_INTERVAL) * FRAME_INTERVAL)
    }

    handleMouseDown(e: React.MouseEvent) {
        this.props.onChange(this.getCursorFromMouse(e))
        $('body').css('cursor', 'ew-resize')
            .on('mousemove', this.onMouseMove).on('mouseup', this.onMouseUp)
    }

    handleMouseMove(e: React.MouseEvent) {
        var cursor = this.getCursorFromMouse(e)
        e.shiftKey ?
            this.props.shiftTo(cursor) :
            this.props.onChange(cursor)
        e.preventDefault()
    }

    handleMouseUp(e: React.MouseEvent) {
        $('body').css('cursor', '')
            .off('mousemove', this.onMouseMove).off('mouseup', this.onMouseUp)
    }

    render() {
        var left = this.props.data * this.props.frameScale,
            marginLeft = this.props.marginLeft

        setTimeout(() => {
            var cursor = $(this.refs['cursor'])
            cursor.css('min-height', cursor.next()[0].scrollHeight)
        }, 0)

        return <div ref="cursor" style={$.extend({}, TIMELINE_CURSOR_STYLE, { left, marginLeft })}
            title="drag to move\npress SHIFT and drag to extend/shrink timeline"
            onMouseDown={ e => this.handleMouseDown(e) }></div>
    }
}
