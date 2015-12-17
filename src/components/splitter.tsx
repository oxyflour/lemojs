/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

// TODO: emit this style to css
// https://github.com/js-next/react-style/pull/132
const STYLE = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: '#ddd',
    zIndex: 99,
}

function clamp(x: number, min: number, max: number) {
    return x < min ? min : (x > max ? max : x)
}

export class Splitter extends React.Component<any, {}> {
    onMouseMove = this.handleMouseMove.bind(this)
    onMouseUp = this.handleMouseUp.bind(this)

    currentMouseData: {
        type: string,
        elem: JQuery,
        range: {
            min: number,
            max: number
        },
        x: number,
        y: number,
    }

    handleMouseDown(e: React.MouseEvent) {
        var type = this.props.orientation,
            elem = $(this.refs['elem']).parent()

        this.currentMouseData = {
            type, elem,
            range: {
                min: this.props.min ? parseFloat(this.props.min) : 0,
                max: this.props.max ? parseFloat(this.props.max) : 1,
            },
            x: elem.width() + e.pageX,
            y: elem.height() + e.pageY
        }

        var cursor = { horizontal:'ns-resize', vertical:'ew-resize' }[type]
        $('body').css('cursor', cursor || $('body').css('cursor'))
            .on('mousemove', this.onMouseMove).on('mouseup', this.onMouseUp)
    }

    handleMouseMove(e: JQueryMouseEventObject) {
        var { type, range, elem, x, y } = this.currentMouseData
        if (type === 'horizontal') {
            var weight = (y - e.pageY) / elem.parent().height()
            weight = clamp(weight, range.min, range.max)
            elem.height(weight * 100 + '%')
            elem.prev().height((1 - weight) * 100 + '%')
        }
        else if (type === 'vertical') {
            var weight = (x - e.pageX) / elem.parent().width()
            weight = clamp(weight, range.min, range.max)
            elem.width(weight * 100 + '%')
            elem.prev().width((1 - weight) * 100 + '%')
        }
        e.preventDefault()
    }

    handleMouseUp(e: JQueryMouseEventObject) {
        $('body').css('cursor', 'auto')
            .off('mousemove', this.onMouseMove).off('mouseup', this.onMouseUp)
    }

    componentDidMount() {
        var elem = $(this.refs['elem']),
            parent = elem.parent()
        parent.css('position', 'relative')
        parent.css('overflow', 'auto').parent().css('overflow', 'auto')
        if (this.props.orientation === 'horizontal') {
            parent.css('width', '100%').parent().css('width', '100%')
            elem.next().css('width', '100%').css('overflow', 'auto')
        }
        else if (this.props.orientation === 'vertical') {
            parent.css('height', '100%').parent().css('height', '100%')
            parent.css('float', 'left').css('height', '100%').css('overflow', 'auto')
                .prev().css('float', 'left').css('height', '100%')
            elem.next().css('height', '100%').css('overflow', 'auto')
        }
    }

    render() {
        var style = { }
        if (this.props.orientation === 'horizontal') style = {
            height: parseInt(this.props.splitterSize || 3),
            cursor: 'ns-resize',
        }
        else if (this.props.orientation === 'vertical') style = {
            width: parseInt(this.props.splitterSize || 3),
            cursor: 'ew-resize',
        }
        return <div ref="elem" style={$.extend({}, STYLE, style)}
            onMouseDown={ e => this.handleMouseDown(e) }></div>
    }
}
