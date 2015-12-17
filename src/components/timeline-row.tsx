/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { AnimObject, AnimNode, Timeline } from '../timeline'

import { TimelineNode } from './timeline-node'

// TODO: emit to css
// https://github.com/js-next/react-style/pull/132
const TIMELINE_ROW_STYLE = {
    padding: '0.2em 0',
    whiteSpace: 'nowrap',
}

const TIMELINE_HEAD_STYLE = {
    display: 'inline-block',
    cursor: 'pointer',
    border: '2px solid transparent',
}

const TIMELINE_ROW_EDIT_STYLE = {
    color: '#888',
    padding: '0 0.2em',
}

const TIMELINE_ADD_NODE_STYLE = {
    paddingLeft: '1em',
    paddingRight: '1em',
    background: '#eee',
    cursor: 'pointer',
    display: 'inline-block',
    border: 'solid 2px transparent',
}

export class TimelineRow extends React.Component<{
    data: AnimObject,
    key: number,
    timeline: Timeline,
    frameScale: number,
    marginLeft: number,
    //
    startRowSortting(e: React.MouseEvent)
}, {}> {
    toggleAnimObjectEnableDisable(e: React.MouseEvent) {
        this.props.timeline.toggleAnimObjectEnableDisable(this.props.data)
        e.stopPropagation()
    }

    handleClickRowHeader(e: React.MouseEvent) {
        this.props.timeline.activeAnimObject = this.props.data
        this.props.timeline.activeAnimNode = null
        e.stopPropagation()
    }

    handleShowHideObject(e: React.MouseEvent) {
        this.props.data.disabled = !this.props.data.disabled
        this.props.timeline.forceUpdate()
        this.props.timeline.refreshAnimObject(this.props.data)
        e.stopPropagation()
    }

    render() {
        var isActive = this.props.data === this.props.timeline.activeAnimObject,
            fontWeight = isActive ? 'bold' : 'normal',
            visibility = isActive ? 'visible' : 'hidden',
            width = this.props.marginLeft,
            opacity = this.props.data.disabled ? 0.3 : 1
        return <div style={$.extend({}, TIMELINE_ROW_STYLE, { opacity })}>
            <div className="addon-hover-to-see"
                style={$.extend({}, TIMELINE_HEAD_STYLE, { fontWeight, width })}
                title="click to edit this object\ndouble click to clone\ndrag to resort"
                onClick={ e => this.handleClickRowHeader(e) }
                onMouseDown={ e => this.props.startRowSortting(e) }
                onDoubleClick= { e => this.props.timeline.cloneActiveAnimObject() }>
                <span className="text-primary">{ this.props.data.name }</span>
                <div className="pull-right hover-to-see">
                    <small className="glyphicon glyphicon-eye-open"
                        title="click to show/hide this object\ndouble click to hide/show others"
                        style={ TIMELINE_ROW_EDIT_STYLE }
                        onMouseDown={ e => e.stopPropagation() }
                        onDoubleClick={ e => this.toggleAnimObjectEnableDisable(e) }
                        onClick={ e=> this.handleShowHideObject(e) }></small>
                </div>
            </div>
            {this.props.data.nodes.map(function(node, index) {
                return <TimelineNode {...this.props} data={ node } key={ index } />
            }, this)}
            {isActive && <span
                style={ TIMELINE_ADD_NODE_STYLE }
                title="add node"
                onMouseDown={ e => e.stopPropagation() }
                onClick={ e => this.props.timeline.addAnimNode() }>
                +
            </span>}
        </div>
    }
}
