/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { AnimObject, AnimNode, Timeline } from '../timeline'

import { TimelineCursor } from './timeline-cursor'
import { TimelineRow } from './timeline-row'

// TODO: emit to css
// https://github.com/js-next/react-style/pull/132
const TIMELINE_TABLE_STYLE = {
     position: 'relative',
     overflow: 'auto',
     height: '100%',
}

const TIMELINE_ROWCONTAINER_STYLE = {
    height: '100%',
    outline: 'none !important',
}

export class TimelineTable extends React.Component<{
    data: AnimObject[],
    timeline: Timeline,
    duration: number,
    ref: string,
}, {}> {
    lastFrameScale = 0

    state = {
        frameScale: 0.1,
        marginLeft: 120,
    }

    startMovingCursor(e: React.MouseEvent) {
        (this.refs['cursor'] as TimelineCursor).handleMouseDown(e)
    }

    //

    rescaleFrame(factor) {
        this.setState({ frameScale: this.state.frameScale * factor })
    }

    updateScroll(oldScale: number, newScale: number) {
        if (!oldScale) return
        var elem = $(this.refs['table']),
            scrollLeft = elem.scrollLeft(),
            delta = (newScale - oldScale) * this.props.timeline.cursorPosition
        elem.scrollLeft(scrollLeft + delta)
        // dirty hack for chrome
        setTimeout(() => elem.scrollLeft(scrollLeft + delta), 0)
    }

    //

    startRowSortting(index: number, e: React.MouseEvent) {
        $(this.refs['rows']).simpleDraggable(pos => {
            var list = this.props.data
            if (pos >= 0 && pos < index)
                list.splice(pos, 0, list.splice(index, 1)[0])
            else if (pos > index + 1)
                list.splice(pos - 1, 0, list.splice(index, 1)[0])
            this.props.timeline.forceUpdate()
        }, e as any as JQueryEventObject)
        e.stopPropagation()
    }

    //

    handleKeyUp(e: React.KeyboardEvent) {
        if (e.keyCode === 46)
            this.props.timeline.removeActiveAnimNode()
        else if (e.ctrlKey && e.keyCode === 'C'.charCodeAt(0))
            this.props.timeline.cloneActiveAnimNode()
    }

    render() {
        if (this.lastFrameScale !== this.state.frameScale)
            this.updateScroll(this.lastFrameScale, this.lastFrameScale = this.state.frameScale)

        var minWidth = this.state.marginLeft + this.state.frameScale * (this.props.duration + 1)
        return <div ref="table" style={ TIMELINE_TABLE_STYLE }>
            <TimelineCursor ref="cursor" {...this.props} data={ this.props.timeline.cursorPosition }
                frameScale={ this.state.frameScale }
                marginLeft={ this.state.marginLeft } />
            <div ref="rows" style={$.extend({}, TIMELINE_ROWCONTAINER_STYLE, { minWidth })}
                onMouseDown={ e => this.startMovingCursor(e) }
                onKeyUp={ e => this.handleKeyUp(e) } tabIndex={ -1 }>
                {this.props.data.map(function(line, index) {
                    return <TimelineRow {...this.props} data={ line } key={ index }
                        startRowSortting={ e => this.startRowSortting(index, e) }
                        marginLeft={ this.state.marginLeft }
                        frameScale={ this.state.frameScale } />
                }, this)}
            </div>
        </div>
    }
}
