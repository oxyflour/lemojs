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

    canvasStyle: { width:number, height:number, background:string },
    updateCanvas: (data: { width:number, height:number, background:string }) => void,
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

    updateCanvasData(key: string, value: any) {
        var data = JSON.parse(JSON.stringify(this.props.canvasStyle))
        data[key] = value
        this.props.updateCanvas(data)
    }

    render() {
        return <div style={ CONTAINER_STYLE }
            onMouseMove={ e => this.updateMousePosition(e) }>
            <div>
                <a href="javascript:void(0)" onClick={ e => $(this.refs['canvas-para']).toggle() }>
                    { this.props.canvasStyle.width }x{ this.props.canvasStyle.height }
                </a>
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
            <form ref="canvas-para" style={{ display:'none' }} className="form-inline">
                <div className="form-group">
                    <label className="sr-only" htmlFor="canvasWidth">canvas width</label>
                    <label className="sr-only" htmlFor="canvasHeight">canvas height</label>
                    <label className="sr-only" htmlFor="canvasBackground">canvas background</label>
                    <div className="input-group">
                        <input type="number" id="canvasWidth" placeholder="Width" className="form-control"
                            value={ this.props.canvasStyle.width.toString() }
                            onChange={ e => this.updateCanvasData('width', parseInt(e.target['value'])) } />
                        <span style={{ width:0, display:"table-cell" }}></span>
                        <input type="number" id="canvasHeight" placeholder="Height"
                            className="form-control" style={{ borderLeft:'none' }}
                            value={ this.props.canvasStyle.height.toString() }
                            onChange={ e => this.updateCanvasData('height', parseInt(e.target['value'])) } />
                        <span style={{ width:0, display:"table-cell" }}></span>
                        <input type="color" id="canvasBackground" placeholder="background"
                            className="form-control" style={{ minWidth:45, borderLeft:'none' }}
                            value={ this.props.canvasStyle.background }
                            onChange={ e => this.updateCanvasData('background', e.target['value']) } />
                        <div className="input-group-btn">
                            <button type="button" className="btn btn-default"
                                onClick={ e => $(this.refs['canvas-para']).hide() }>OK</button>
                        </div>
                    </div>
                </div>
            </form>
            <div style={$.extend({}, CANVAS_STYLE, this.props.canvasStyle)}>
                <div ref="canvas"></div>
                {/* this.state.showControls && this.props.data.map((item, index) => {
                    return <CanvasNode {...this.props} data={ item.anim.nodes[item.index] }
                        anim={ item.anim } index={ item.index } progress={ item.progress } key={ index } />
                }) */}
            </div>
        </div>
    }
}
