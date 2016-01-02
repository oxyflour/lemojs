/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { AnimNode, AnimObject, Timeline } from '../timeline'

const HIGHLIGHT_PRIMARY_COLOR = '#eee'
const HIGHLIGHT_DARK_COLOR = '#1abc9c'

const ANIM_NODE_STYLE = {
    position: 'absolute',
    background: '#bbb',
    textAlign: 'center',
    opacity: 0.3,
    border: '2px solid transparent',
}

export class CanvasNode extends React.Component<{
    data: AnimNode,
    timeline: Timeline,
}, { }> {
    onMouseMove = this.handleMouseMove.bind(this)
    onMouseUp = this.handleMouseUp.bind(this)

    currentMouseData: {
        startX: number,
        startY: number,
        hasMoved?: boolean,
    }

    getDataValue(key: string, index = this.index) {
        var data = this.anim && this.anim.nodes[index]
        if (data) {
            var val = data[key]
            if (typeof val === 'object') {
                key = Object.keys(val)[0]
                return parseFloat(val[key])
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

    anim: AnimObject
    index: number

    render() {
        this.anim = this.props.timeline.getAnimObjectFromNode(this.props.data)
        this.index = this.anim ? this.anim.nodes.indexOf(this.props.data) : -1

        var x = this.getDataValue('shiftX'),
            y = this.getDataValue('shiftY'),
            w = (parseFloat(this.getDataValue('radiusX') || this.getDataValue('radius')) || 0) * 2,
            h = (parseFloat(this.getDataValue('radiusY') || this.getDataValue('radius')) || 0) * 2
        if (x !== undefined && y !== undefined && w > 0 && h > 0) {
            var isActive = this.props.timeline.activeAnimNode === this.props.data,
                borderColor = isActive ? HIGHLIGHT_DARK_COLOR : 'transparent',
                zIndex = isActive ? 99 : 98,
                style = { width:w, height:h, left:x-w/2, top:y-h/2, borderColor, zIndex }
            return <div ref="node" style={ $.extend({}, ANIM_NODE_STYLE, style) }
                //onMouseDown={ e => this.handleMouseDown(e) }
                title={ this.anim.name + ':' + this.index + ' [' + this.anim.animType + ']' }></div>
        }

        return <div />
    }
}
