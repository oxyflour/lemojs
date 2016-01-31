/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { AnimNode, Timeline } from '../timeline'

// TODO: emit to css
// https://github.com/js-next/react-style/pull/132

const HIGHLIGHT_PRIMARY_COLOR = '#eee'
const HIGHLIGHT_DARK_COLOR = '#1abc9c'

const TIMELINE_NODE_STYLE = {
    display: 'inline-block',
    background: HIGHLIGHT_PRIMARY_COLOR,
    border: '2px solid #bbb',
    cursor: 'pointer',
    textAlign: 'right',
}

const TIMELINE_RESIZER_STYLE = {
    cursor: 'ew-resize',
    marginRight: -2,
    paddingRight: 2,
}

export class TimelineNode extends React.Component<{
    data: AnimNode,
    frameScale: number,
    key: number,

    onChange: (node: AnimNode) => void
    onSelected: () => void
}, {}> {
    onMouseMove = this.handleMouseMove.bind(this)
    onMouseUp = this.handleMouseUp.bind(this)

    currentMouseData: {
        attr: string,
        start: number,
        hasMoved?: boolean,
    }

    handleMouseDown(e: React.MouseEvent) {
        var attr = $(e.target).hasClass('resizer') ? 'duration' : 'delay',
            start = this.props.data[attr] - e.pageX / this.props.frameScale

        this.currentMouseData = { attr, start }

        this.props.onSelected()

        var elem = $(this.refs['node']), title = elem.attr('title')
        elem.addClass('ms-down').css('cursor', attr === 'duration' ? 'ew-resize' : 'pointer')
                .attr('data-old-title', title).attr('title', this.props.data.delay + ' : ' + this.props.data.duration)
                .tooltip({ animation: false, container: 'body' })
        setTimeout(() => elem.hasClass('ms-down') && elem.tooltip('show'), 200)

        $('body').css('cursor', 'ew-resize')
            .on('mousemove', this.onMouseMove).on('mouseup', this.onMouseUp)

        e.stopPropagation()
    }

    handleMouseMove(e: JQueryEventObject) {
        var { attr, start } = this.currentMouseData,
            position = start + e.pageX / this.props.frameScale
        position = Math.max(Math.floor(position), attr === 'duration' ? 1 : 0)

        if (this.props.data[attr] != position) {
            this.currentMouseData.hasMoved = true
            this.props.data[attr] = position

            // update position
            this.forceUpdate()

            // update tooltip
            $(this.refs['node'])
                .attr('data-original-title', this.props.data.delay + ' : ' + this.props.data.duration)
                .tooltip('show')
        }

        e.preventDefault()
    }

    handleMouseUp(e: JQueryEventObject) {
        if (this.currentMouseData.hasMoved) {
            this.props.onChange(this.props.data)
        }
        else {
            var startPosition = this.props.timeline.getAnimNodeStart(this.props.data),
                cursorPosition = this.props.timeline.cursorPosition
            if (cursorPosition < startPosition || cursorPosition > startPosition + this.props.data.duration)
                this.props.timeline.cursorPosition = startPosition
        }

        var elem = $(this.refs['node'])
        elem.removeClass('ms-down')
            .css('cursor', 'pointer')
            .attr('title', elem.attr('data-old-title'))
            .tooltip('destroy')

        $('body').css('cursor', 'auto')
            .off('mousemove', this.onMouseMove).off('mouseup', this.onMouseUp)
    }

    handleDoubleClick(e: React.MouseEvent) {
        this.props.timeline.cloneActiveAnimNode()

        e.stopPropagation()
        e.preventDefault()
    }

    render() {
        var marginLeft = this.props.data.delay * this.props.frameScale,
            width = this.props.data.duration * this.props.frameScale,

            isActive = this.props.timeline.activeAnimNode === this.props.data,
            borderColor = isActive ? HIGHLIGHT_DARK_COLOR : 'transparent',
            borderRightColor = isActive ? HIGHLIGHT_DARK_COLOR : '#bbb',
            opacity = isActive ? 1 : 0

        return <div ref="node"
            style={$.extend({}, TIMELINE_NODE_STYLE, { marginLeft, width, borderColor, borderRightColor })}
            title="drag to move\ndouble click to clone"
            onMouseDown={ e => this.handleMouseDown(e) }
            onDoubleClick={ e => this.handleDoubleClick(e) }>
                <span className="resizer" style={$.extend({}, TIMELINE_RESIZER_STYLE, { opacity })}
                    title="drag to change the duration"
                    onMouseDown={ e => this.handleMouseDown(e) }> | </span>
        </div>
    }
}
