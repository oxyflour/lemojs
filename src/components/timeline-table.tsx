/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { Animation, Tween } from '../timeline'

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

const TIMELINE_TWEEN_STYLE = {
    display: 'inline-block',
    background: '#eee',
    border: 'solid 2px transparent',
    borderRight: 'none',
}

const TIMELINE_MOVE_TWEEN_STYLE = {
    display: 'block',
    width: '100%',
}

const TIMELINE_RESIZE_TWEEN_STYLE = {
    display: 'block',
    float: 'right',
    width: 8,
    borderRight: '3px solid #aaa',
}

const TIMELINE_ADD_TWEEN_STYLE = {
    paddingLeft: '1em',
    paddingRight: '1em',
    background: '#eee',
    cursor: 'pointer',
    display: 'inline-block',
    border: 'solid 2px transparent',
}

export class TimelineTable extends React.Component<{
    timeline: Animation[]
    onTimelineChange: (timeline: Animation[]) => void

    cursorPosition: number
    onCursorChange: (cursorPosition: number) => void

    activeTween: Tween
    addTween: (anim: Animation) => void
    setActiveTween: (tween: Tween) => void
    updateTween: (tween: Tween, update: any) => void

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

    renderRow(anim: Animation, index: number) {
        var isActive = anim.tweens.indexOf(this.props.activeTween) >= 0,
            fontWeight = isActive ? 'bold' : 'normal'
        return <div style={ TIMELINE_ROW_STYLE } key={ index }>
            <div style={ TIMELINE_ROWHEADER_STYLE }
                onClick={ e => this.props.setActiveTween(anim.tweens[0]) }
                onMouseDown={ e => this.startRowSortting(index, e) }>
                <span className="text-primary"
                    style={{ fontWeight }}>{ anim.name }</span>
            </div>
            { anim.tweens.map((tween, index) => this.renderTween(tween, index)) }
            { isActive && <span style={ TIMELINE_ADD_TWEEN_STYLE }
                onClick={ e => this.props.addTween(anim) }>+</span> }
        </div>
    }

    renderTween(tween: Tween, index: number) {
        var frameScale = this.state.frameScale,
            width = tween.duration * frameScale,
            marginLeft = tween.delay * frameScale,
            borderColor = this.props.activeTween === tween ? '#aaa' : 'transparent'
        return <div style={ clone(TIMELINE_TWEEN_STYLE, { width, marginLeft, borderColor }) }>
            <Slider
                valueX={ tween.duration }
                valueY={ 0 }
                range={{ minX:TIMELINE_RESIZE_TWEEN_STYLE.width / frameScale }}
                scale={ 1 / frameScale }
                style={ TIMELINE_RESIZE_TWEEN_STYLE }
                openHandCursor="ew-resize"
                onChange={ (x, y) => this.props.updateTween(tween, { duration:x }) }>&nbsp;</Slider>
            <Slider
                valueX={ tween.delay }
                valueY={ 0 }
                range={{ minX:0 }}
                scale={ 1 / frameScale }
                style={ TIMELINE_MOVE_TWEEN_STYLE }
                tooltip={ tween.delay + ' : ' + tween.duration }
                onStart={ (x, y) => this.props.setActiveTween(tween) }
                onChange={ (x, y) => this.props.updateTween(tween, { delay:x }) }>&nbsp;</Slider>
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
