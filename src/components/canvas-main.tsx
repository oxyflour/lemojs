/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { CanvasNode } from './canvas-node'

import { AnimNode, AnimObject, Timeline } from '../timeline'

const CONTAINER_STYLE = {
    padding: 10,
    height: '100%',
    overflow: 'auto',
}

const CANVAS_STYLE = {
    margin: '30px auto',
    background: '#eee',
    position: 'relative',
}

export class CanvasMain extends React.Component<{
    data: {
        anim: AnimObject,
        index: number,
        progress: number,
    }[],
    timeline: Timeline,
    ref: string,
    size: { width:number, height:number },
}, {}> {
    state = {
        showControls: false
    }

    updateMousePosition(e: React.MouseEvent) {
        var offset = $(this.refs['canvas']).offset(),
            posX = Math.floor(e.pageX - offset.left),
            posY = Math.floor(e.pageY - offset.top)
        $(this.refs['coords']).text('(' + posX + ', ' + posY + ')')
    }

    render() {
        return <div style={ CONTAINER_STYLE }
            onMouseMove={ e => this.updateMousePosition(e) }>
            <div>
                <span>{ this.props.size.width }x{ this.props.size.height }</span>
                &nbsp;
                <span>@{ Math.floor(this.props.timeline.cursorPosition) }ms</span>
                &nbsp;
                <span ref="coords"></span>
                {/*
                  * controls are not usable yet
                  *
                <label className="pull-right" style={{ cursor:'pointer' }}>
                    <input type="checkbox" checked={ this.state.showControls }
                        onChange={ e => this.setState({ showControls:e.target['checked'] }) } />
                    &nbsp;
                    show controls
                </label>
                */}
            </div>
            <div style={$.extend({}, CANVAS_STYLE,
                    { width:this.props.size.width, height:this.props.size.height })}>
                <div ref="canvas"></div>
                { this.state.showControls && this.props.data.map((item, index) => {
                    return <CanvasNode {...this.props} data={ item.anim.nodes[item.index] }
                        anim={ item.anim } index={ item.index } progress={ item.progress } key={ index } />
                }) }
            </div>
        </div>
    }
}
