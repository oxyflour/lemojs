/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { AnimNode, AnimObject, Timeline } from '../timeline'

const HIGHLIGHT_PRIMARY_COLOR = '#eee'
const HIGHLIGHT_DARK_COLOR = '#1abc9c'

const ANIM_NODE_STYLE = {
    position: 'absolute',
    background: '#bbb',
    cursor: 'all-scroll',
    textAlign: 'center',
    opacity: 0.3,
    border: '2px solid transparent',
}

function lerp(start, end, fac) {
    return start * (1 - fac) + end * fac
}

export class CanvasNode extends React.Component<{
    data: AnimNode,
    anim: AnimObject,
    index: number,
    progress: number,
    timeline: Timeline,
    key: number,
}, { }> {
    onMouseMove = this.handleMouseMove.bind(this)
    onMouseUp = this.handleMouseUp.bind(this)

    currentMouseData: {
        startX: number,
        startY: number,
        hasMoved?: boolean,
    }

    getDataValue(key: string, index = this.props.index) {
        var data = this.props.anim.nodes[index]
        if (data) {
            var val = data[key],
                fac = this.props.progress
            if (Array.isArray(val)) {
                return lerp(val[0], val[1], fac)
            }
            else if (typeof val === 'object') {
                var k = parseFloat(Object.keys(val)[0])
                return lerp(k, parseFloat(val[k]), fac)
            }
            else if (val === undefined) {
                return this.getDataValue(key, index - 1)
            }
            else
                return val
        }
    }

    handleMouseDown(e: React.MouseEvent) {
        this.currentMouseData = { startX: e.pageX, startY: e.pageY, }

        if (this.props.timeline.activeAnimNode !== this.props.data)
            this.props.timeline.activeAnimNode = this.props.data

        var elem = $(this.refs['node']).addClass('ms-down')
            .attr('data-original-title', this.getDataValue('shiftX') + ', ' + this.getDataValue('shiftY'))
            .tooltip({ animation: false, container: 'body' })
        setTimeout(() => elem.hasClass('ms-down') && elem.tooltip('show'), 200)

        $('body').css('cursor', 'ew-resize')
            .on('mousemove', this.onMouseMove).on('mouseup', this.onMouseUp)

        e.stopPropagation()
    }

    handleMouseMove(e: JQueryEventObject) {
        var msd = this.currentMouseData
        if (e.pageX !== msd.startX || e.pageY !== msd.startY) {
            this.props.data['shiftX'] = (this.getDataValue('shiftX') || 0) + e.pageX - msd.startX
            this.props.data['shiftY'] = (this.getDataValue('shiftY') || 0) + e.pageY - msd.startY

            msd.hasMoved = true
            msd.startX = e.pageX
            msd.startY = e.pageY

            this.forceUpdate()

            // update tooltip
            $(this.refs['node'])
                .attr('data-original-title', this.getDataValue('shiftX') + ', ' + this.getDataValue('shiftY'))
                .tooltip('show')
        }
    }

    handleMouseUp(e: JQueryEventObject) {
        if (this.currentMouseData.hasMoved) {
            this.props.timeline.forceUpdate()
            this.props.timeline.refreshAnimObject(this.props.data)
        }

        $(this.refs['node']).removeClass('ms-down')
            .tooltip('destroy')

        $('body').css('cursor', 'auto')
            .off('mousemove', this.onMouseMove).off('mouseup', this.onMouseUp)
    }

    render() {
        var width = (parseFloat(this.getDataValue('radiusX') || this.getDataValue('radius')) || 20) * 2,
            height = (parseFloat(this.getDataValue('radiusY') || this.getDataValue('radius')) || 20) * 2,

            lineHeight = height + 'px',
            borderRadius = height / 2,
            x = this.getDataValue('shiftX') || 0,
            y = this.getDataValue('shiftY') || 0,
            left = x - width / 2,
            top = y - height / 2,

            isActive = this.props.timeline.activeAnimNode === this.props.data,
            borderColor = isActive ? HIGHLIGHT_DARK_COLOR : 'transparent',
            zIndex = isActive ? 99 : 98

        // TODO: refactor
        if (this.props.data.animType === 'transit') {
            if (this.props.data['type'] === 'line')
                width = height = 20
            left = x - width / 2
            top = y - height / 2
        }

        var style = { left, top, width, height, borderColor, lineHeight, borderRadius, zIndex }
        return <div ref="node" style={ $.extend({}, ANIM_NODE_STYLE, style) }
            onMouseDown={ e => this.handleMouseDown(e) }>
        </div>
    }
}
