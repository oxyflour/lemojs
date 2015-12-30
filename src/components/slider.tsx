/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { clamp } from '../utils'

const OPENHAND_URL = 'url(http://cdn.bootcss.com/diva.js/BETA-3.0.0/img/openhand.cur), pointer'
const CLOSEDHAND_URL = 'url(http://cdn.bootcss.com/diva.js/BETA-3.0.0/img/closedhand.cur), pointer'

export class Slider extends React.Component<{
    valueX: number,
    valueY: number,
    scale?: number,
    step?: number,
    range?: {
        minX?: number,
        maxX?: number,
        minY?: number,
        maxY?: number,
    },
    title?: string,
    className?: string,
    onChange?: (x: number, y: number) => void,
    onStart?: (x: number, y: number) => void,
    onEnd?: (x: number, y: number) => void,
    children?: React.ReactElement<any>
}, {}> {
    onMouseMove = this.handleMouseMove.bind(this)
    onMouseUp = this.handleMouseUp.bind(this)

    currentMouseData : {
        x: number,
        y: number,
        vx: number,
        vy: number,
    }

    getValues(x, y) {
        var d = this.currentMouseData,
            f = this.props.scale || 1,
            s = this.props.step || 1,
            dx = x - d.x, dy = y - d.y,
            { minX = -Infinity, maxX = Infinity, minY = -Infinity, maxY = Infinity } = this.props.range || { }
        x = clamp(d.vx + s * Math.floor(dx * f), minX, maxX)
        y = clamp(d.vy + s * Math.floor(dy * f), minY, maxY)
        return { x, y }
    }

    handleMouseDown(e: React.MouseEvent) {
        this.props.onStart && this.props.onStart(this.props.valueX, this.props.valueY)

        this.currentMouseData = { x:e.pageX, y:e.pageY, vx:this.props.valueX, vy:this.props.valueY }
        $(document).on('mousemove', this.onMouseMove).on('mouseup', this.onMouseUp)
        $('body').css('cursor', CLOSEDHAND_URL)
        $(this.refs['elem']).css('cursor', CLOSEDHAND_URL)

        e.preventDefault()
        e.stopPropagation()
    }

    handleMouseMove(e: React.MouseEvent) {
        var { x, y } = this.getValues(e.pageX, e.pageY)
        this.props.onChange(x, y)

        e.preventDefault()
        e.stopPropagation()
    }

    handleMouseUp(e: React.MouseEvent) {
        var { x, y } = this.getValues(e.pageX, e.pageY)
        this.props.onEnd && this.props.onEnd(x, y)

        $(document).off('mousemove', this.onMouseMove).off('mouseup', this.onMouseUp)
        $('body').css('cursor', 'auto')
        $(this.refs['elem']).css('cursor', OPENHAND_URL)
    }

    render() {
        return <span ref="elem" className={ this.props.className} style={{ cursor:OPENHAND_URL }}
            title={ this.props.title || 'drag to alter' }
            onMouseDown={ e => this.handleMouseDown(e) }>
            { this.props.children }
        </span>
    }
}
