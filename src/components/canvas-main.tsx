/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'
import { Modal } from './modal'

import { Tween, Animation } from '../timeline'

const CONTAINER_STYLE = {
    padding: 10,
    height: '100%',
    overflow: 'auto',
}

const CANVAS_STYLE = {
    marginLeft: 'auto',
    marginRight: 'auto',
    background: '#eee',
    position: 'relative',
    top: '50%',
}

interface CanvasStyle {
     width: number
     height: number
     background: string
}

export class CanvasMain extends React.Component<{
    cursorPosition: number,

    canvasStyle: CanvasStyle,
    updateCanvas: (data: CanvasStyle) => void,

    children?: React.ReactElement<any>,
}, {}> {
    state: CanvasStyle = {
        width: 0,
        height: 0,
        background: ''
    }

    updateMousePosition(e: React.MouseEvent) {
        var offset = $(this.refs['content']).offset(),
            x = Math.floor(e.pageX - offset.left),
            y = Math.floor(e.pageY - offset.top)
        $(this.refs['coords']).text('(' + x + ', ' + y + ')')
    }

    render() {
        return <div style={ CONTAINER_STYLE }
            onMouseMove={ e => this.updateMousePosition(e) }>
            <Modal ref="config" title="Update Canvas">
                <form className="form-horizontal"
                    onSubmit={ e => (this.props.updateCanvas($.extend({}, this.state)),
                        (this.refs['config'] as Modal).hide(), e.preventDefault()) }>
                    <div className="form-group">
                        <label className="col-xs-4 control-label">Size</label>
                        <div className="col-xs-8">
                            <div className="input-group">
                                <input type="number" placeholder="Width" className="form-control"
                                    value={ this.state.width.toString() }
                                    onChange={ e => this.setState({ width: parseInt(e.target['value']) })} />
                                <span className="input-group-addon">x</span>
                                <input type="number" placeholder="Height" className="form-control"
                                    value={ this.state.height.toString() }
                                    onChange={ e => this.setState({ height: parseInt(e.target['value']) })} />
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="col-xs-4 control-label">Background</label>
                        <div className="col-xs-8">
                            <div className="input-group" style={{ width:'100%' }}>
                                <input type="text" className="form-control" placeholder="color"
                                    style={{ borderRight:'none' }}
                                    value={ this.state.background }
                                    onChange={ e => this.setState({ background: e.target['value'] }) } />
                                <span style={{ width:0, display:"table-cell" }}></span>
                                <input type="color" className="form-control"
                                    style={{ borderLeft:'none', minWidth:40, cursor:'pointer' }}
                                    value={ /#[0-9a-fA-F]{6}/.test(this.state.background) ? this.state.background : null }
                                    onChange={ e => this.setState({ background: e.target['value'] }) } />
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="col-xs-8 col-xs-offset-4">
                            <button className="btn btn-primary">OK</button>
                        </div>
                    </div>
                </form>
            </Modal>
            <div style={{ position:'absolute' }}>
                <div>
                    <a href="javascript:void(0)"
                        onClick={ e => this.setState(this.props.canvasStyle, () => (this.refs['config'] as Modal).show()) }>
                        { this.props.canvasStyle.width }x{ this.props.canvasStyle.height }
                    </a>
                    &nbsp;
                    <span>@{ Math.floor(this.props.cursorPosition) }ms</span>
                    &nbsp;
                    <span ref="coords"></span>
                </div>
            </div>
            <div ref="content" style={$.extend({ marginTop:-this.props.canvasStyle.height / 2 },
                    CANVAS_STYLE, this.props.canvasStyle)}>
                { this.props.children }
            </div>
        </div>
    }
}
