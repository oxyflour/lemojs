/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { clamp, clone } from '../utils'

const OPENHAND_URL = 'url(http://cdn.bootcss.com/diva.js/BETA-3.0.0/img/openhand.cur), pointer'
const CLOSEDHAND_URL = 'url(http://cdn.bootcss.com/diva.js/BETA-3.0.0/img/closedhand.cur), pointer'

export class Slider extends React.Component<{
    valueX: number
    valueY: number
    scale?: number
    step?: number
    range?: {
        minX?: number
        maxX?: number
        minY?: number
        maxY?: number
    }
    onChange?: (x: number, y: number, e?: React.MouseEvent) => void
    onStart?: (x: number, y: number, e?: React.MouseEvent) => void
    onEnd?: (x: number, y: number, e?: React.MouseEvent) => void
    onDoubleClick?: (e?: React.MouseEvent) => void

    openHandCursor?: string
    closeHandCursor?: string
    tooltip?: string

    title?: string
    className?: string
    style?: React.CSSProperties
    children?: React.ReactElement<any>
    key?: number
}, {}> {
    onMouseMove = this.handleMouseMove.bind(this)
    onMouseUp = this.handleMouseUp.bind(this)

    currentMouseData : {
        x: number,
        y: number,
        vx: number,
        vy: number,
        scale: number,
    }

    getValues(x, y) {
        var d = this.currentMouseData,
            s = this.props.step || 1,
            f = d.scale || 1,
            dx = x - d.x, dy = y - d.y,
            { minX = -Infinity, maxX = Infinity, minY = -Infinity, maxY = Infinity } = this.props.range || { }
        x = clamp(d.vx + s * Math.floor(dx * f), minX, maxX)
        y = clamp(d.vy + s * Math.floor(dy * f), minY, maxY)
        return { x, y }
    }

    handleMouseDown(e: React.MouseEvent) {
        this.props.onStart && this.props.onStart(this.props.valueX, this.props.valueY, e)

        this.currentMouseData = {
            x: e.pageX, y: e.pageY,
            vx: this.props.valueX, vy: this.props.valueY,
            scale: (this.props.scale || 1) * (e.shiftKey ? 0.5 : 1)
        }
        $(document).on('mousemove', this.onMouseMove).on('mouseup', this.onMouseUp)
        $('body').css('cursor', this.props.closeHandCursor || CLOSEDHAND_URL)
        $(this.refs['elem']).css('cursor', this.props.closeHandCursor || CLOSEDHAND_URL)

        if (this.props.tooltip) $(this.refs['elem'])
            .attr('title', this.props.tooltip)
            .addClass('mouse-is-down')
            .tooltip({ container:'body', animation:false })
        setTimeout(() => $(this.refs['elem']).filter('.mouse-is-down').tooltip('show'), 200)

        e.preventDefault()
        e.stopPropagation()
    }

    handleMouseMove(e: React.MouseEvent) {
        var { x, y } = this.getValues(e.pageX, e.pageY)
        this.props.onChange && this.props.onChange(x, y, e)

        if (this.props.tooltip) $(this.refs['elem'])
            .attr('data-original-title', this.props.tooltip)
            .tooltip('show')

        e.preventDefault()
        e.stopPropagation()
    }

    handleMouseUp(e: React.MouseEvent) {
        var { x, y } = this.getValues(e.pageX, e.pageY)
        this.props.onEnd && this.props.onEnd(x, y, e)

        $(document).off('mousemove', this.onMouseMove).off('mouseup', this.onMouseUp)
        $('body').css('cursor', 'auto')
        $(this.refs['elem']).css('cursor', this.props.openHandCursor || OPENHAND_URL)

        if (this.props.tooltip) $(this.refs['elem'])
            .attr('title', this.props.title)
            .removeClass('mouse-is-down')
            .tooltip('destroy')
    }

    render() {
        return <span ref="elem" className={ this.props.className}
            style={ clone({ cursor:this.props.openHandCursor || OPENHAND_URL }, this.props.style || { })}
            title={ this.props.title || 'drag to alter' }
            onDoubleClick={ e => this.props.onDoubleClick(e) }
            onMouseDown={ e => this.handleMouseDown(e) }>
            { this.props.children }
        </span>
    }
}
