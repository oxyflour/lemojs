/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../typings/mojs.d.ts"/>

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { Splitter } from './components/splitter'
import { ObjectEditor, NodeEditor } from './components/anim-editor'
import { CanvasMain } from './components/canvas-main'
import { CanvasNode } from './components/canvas-node'
import { TimelineTable } from './components/timeline-table'

import { AnimNode, AnimObject, AnimManager, Timeline } from './timeline'

const VERSION_STRING = '0.0.1'
const CANVAS_STYLE = { width:320, height:480, background:'#eeeeee' }

interface ProjectObject {
    version: string,
    timeline: AnimObject[],
    canvasStyle: { width:number, height:number, background:string },
    timelineState: boolean[],
}

export class App extends React.Component<{}, {}> implements Timeline {
    tween = new AnimManager(null)
    state = {
        activeAnimNode: null as AnimNode,
        activeAnimObject: null as AnimObject,
        cursorPosition: 0,

        timeline: [ ] as AnimObject[],
        canvasStyle: $.extend({}, CANVAS_STYLE),
        timelineState: null as boolean[ ]
    }

    shiftAnimObjectToCursor(newCursor: number) {
        var cursor = this.state.cursorPosition,
            cursorMin = 0,
            animsToShift = [ ] as AnimObject[],
            nodesToShiftDelay = [ ] as AnimNode[],
            nodesToShiftDuration = [ ] as AnimNode[]

        this.state.timeline.forEach(anim => {
            var start = 0
            anim.nodes.some(node => {
                if (start <= cursor && cursor < start + node.delay) {
                    cursorMin = Math.max(cursorMin, start)
                    nodesToShiftDelay.push(node)
                    animsToShift.push(anim)
                    return true
                }
                start += node.delay
                if (start <= cursor && cursor < start + node.duration) {
                    cursorMin = Math.max(cursorMin, start)
                    nodesToShiftDuration.push(node)
                    animsToShift.push(anim)
                    return true
                }
                start += node.duration
                cursorMin = Math.max(cursorMin, start)
                return false
            })
        })

        newCursor = Math.max(cursorMin + 1, newCursor)
        if (newCursor !== cursor) {
            var delta = newCursor - cursor
            nodesToShiftDelay.forEach(node => node.delay = Math.floor(node.delay + delta))
            nodesToShiftDuration.forEach(node => node.duration = Math.floor(node.duration + delta))
            animsToShift.forEach(anim => this.refreshAnimObject(anim))
            this.cursorPosition = newCursor
            this.forceUpdate()
        }
    }

    toggleAnimObjectEnableDisable(anim: AnimObject) {
        var timeline = this.state.timeline
        if (this.state.timelineState) {
            if (timeline.length === this.state.timelineState.length)
                this.state.timelineState.forEach((b, i) => timeline[i].disabled = b)
            this.setState({ timelineState: null })
        }
        else {
            var timelineState = timeline.map(a => a.disabled)
            timeline.forEach(a => a.disabled = a !== anim)
            this.setState({ timelineState })
        }
        this.forceUpdate()
        timeline.forEach(anim => this.refreshAnimObject(anim))
    }

    getTimeline() {
        return this.state.timeline
    }

    getAnimObjectFromNode(node: AnimNode) {
        return this.state.timeline.filter(anim => anim.nodes.indexOf(node) >= 0)[0]
    }

    getTimelineObjectFromAnim(anim: AnimObject) {
        return this.tween.hash.get(anim)
    }

    // timeline implement

    get activeAnimNode() { return this.state.activeAnimNode }
    set activeAnimNode(activeAnimNode) { this.setState({ activeAnimNode }) }

    get activeAnimObject() { return this.state.activeAnimObject }
    set activeAnimObject(activeAnimObject) { this.setState({ activeAnimObject }) }

    get cursorPosition() { return this.state.cursorPosition }
    set cursorPosition(cursorPosition) {
        this.tween.setProgress(cursorPosition / this.tween.getDuration())
        this.setState({ cursorPosition })
    }

    removeActiveAnimNode() {
        var anim = this.getAnimObjectFromNode(this.activeAnimNode)
        this.state.timeline.forEach(anim =>
            anim.nodes = anim.nodes.filter(node => node !== this.state.activeAnimNode))
        this.refreshAnimObject(anim)
        this.activeAnimNode = null
    }

    cloneActiveAnimNode() {
        if (!this.activeAnimNode) return
        var node = JSON.parse(JSON.stringify(this.activeAnimNode)),
            anim = this.getAnimObjectFromNode(this.activeAnimNode)
        if (!anim) return
        anim.nodes.splice(anim.nodes.indexOf(this.activeAnimNode), 0, node)
        this.refreshAnimObject(anim)
        this.activeAnimNode = node
        this.cursorPosition = this.getAnimNodeStart(node)
    }

    addAnimNode(index?: number) {
        if (index >= 0 && this.state.timeline[index])
            this.activeAnimObject = this.state.timeline[index]
        if (!this.activeAnimObject) return
        var animType = this.activeAnimObject.animType,
            shiftX = this.state.canvasStyle.width / 2,
            shiftY = this.state.canvasStyle.height / 2,
            node = { delay:0, duration:1000, animType, shiftX, shiftY }
        this.activeAnimObject.nodes.push(node)
        this.refreshAnimObject(this.activeAnimObject)
        this.activeAnimNode = node
    }

    getAnimNodeStart(node: AnimNode) {
        var anim = this.getAnimObjectFromNode(node),
            start = 0
        if (anim) anim.nodes.some(n => {
            start += n.delay
            if (n === node)
                return true
            else
                start += n.duration
        })
        return start
    }

    //

    removeActiveAnimObject() {
        if (!this.activeAnimObject) return
        if (this.activeAnimObject.nodes.indexOf(this.activeAnimNode) >= 0)
            this.activeAnimNode = null
        this.activeAnimObject.nodes = []
        this.refreshAnimObject(this.activeAnimObject)

        this.state.timeline = this.state.timeline.filter(anim =>
            anim !== this.activeAnimObject)
        this.activeAnimObject = null
    }

    cloneActiveAnimObject() {
        if (!this.activeAnimObject) return
        var anim = JSON.parse(JSON.stringify(this.activeAnimObject))
        this.state.timeline.splice(this.state.timeline.indexOf(this.activeAnimObject), 0, anim)
        this.refreshAnimObject(anim)
        this.activeAnimObject = anim
    }

    addAnimObject(type: string) {
        var anim = {
            name: type + this.state.timeline.length,
            animType: type,
            nodes: [ ],
        }
        this.state.timeline.push(anim)
        this.activeAnimObject = anim
        this.setState({}, this.addAnimNode.bind(this))
    }

    refreshAnimObject(node: AnimNode | AnimObject) {
        var anim = node['nodes'] ? node as AnimObject : this.getAnimObjectFromNode(node as AnimNode)
        if (anim) this.tween.update(anim)
    }

    // project

    saveProject() {
        var proj: ProjectObject = {
            version: VERSION_STRING,
            canvasStyle: this.state.canvasStyle,
            timeline: this.state.timeline,
            timelineState: this.state.timelineState,
        }
        var content = JSON.stringify(proj, null, 2)
        $(this.refs['saveProjectLink']).attr('href',
            'data:text/json;charset=utf-8,' + encodeURIComponent(content))
        $(this.refs['saveModelDialog']).modal('show')
    }

    loadProject() {
        $('<input type="file">').change(e => {
            var file = (e.target as HTMLInputElement).files[0]
            if (!file) return

            var reader = new FileReader()
            reader.readAsText(file)
            reader.onerror = e => {
                alert(e)
            }
            reader.onload = e => {
                try {
                    this.updateProject(JSON.parse(e.target['result']))
                } catch (e) {
                    reader.onerror(e)
                }
            }
        }).click()
    }

    updateProject(proj: ProjectObject) {
        // compare major version string only
        if (proj.version.replace(/.\w+$/, '') === VERSION_STRING.replace(/.\w+$/, '')) {
            this.state.timeline.forEach(anim => (anim.nodes = [ ]) && this.refreshAnimObject(anim))
            this.setState(proj)
            proj.timeline.forEach(anim => this.refreshAnimObject(anim))
        }
        else {
            throw 'version mismatch'
        }
    }

    newProject() {
        this.updateProject({
            version: VERSION_STRING,
            timeline: [ ],
            canvasStyle: $.extend({}, CANVAS_STYLE),
            timelineState: null,
        })
    }

    componentDidMount() {
        this.tween = new AnimManager(this.refs['anim-pool'] as HTMLElement, {
            onUpdate: (p) => this.setState({ cursorPosition:p * this.tween.getDuration() }),
        })

        $.getJSON('project.json', (proj) => this.updateProject(proj))
    }

    // view

    renderModal(title: string, body: JSX.Element, footer?: JSX.Element, options = { } as any) {
        return <div ref={ options.ref ? options.ref : '' } className="modal fade" tabIndex={ -1 } role="dialog">
            <div className={ 'modal-dialog' + (options.small ? ' modal-sm' : ' ') }>
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">×</span>
                        </button>
                        <h4 className="modal-title">{ title }</h4>
                    </div>
                    <div className="modal-body">{ body }</div>
                    { footer && <div className="modal-footer">{ footer }</div> }
                </div>
            </div>
        </div>
    }

    renderSaveModal() {
        return this.renderModal('Save Project', <div>
            <p>Click <a ref="saveProjectLink" download="project.json">here</a> to download project</p>
        </div>, null, {
            ref: 'saveModelDialog',
        })
    }

    renderHelpModal() {
        return this.renderModal('LeMojs Help', <div>
            <p>help content to be updated...</p>
        </div>, null, {
            ref: 'helpModelDialog',
        })
    }

    renderAboutModal() {
        return this.renderModal('LeMojs Help', <div>
            <p>A Lightweight editor for <a href="https://github.com/legomushroom/mojs">mojs</a></p>
            <a href="https://github.com/oxyflour/lemojs">Github Repo Link</a>
        </div>, null, {
            ref: 'aboutModelDialog',
        })
    }

    renderParameterModal() {
        return this.renderModal('Parameters', <div>
            <p>you can reference the following values with P.parameterName in fields</p>
            <p>not implemented yet</p>
        </div>, null, {
            ref: 'paraModalDialog'
        })
    }

    renderNavBar() {
        return <div className="navbar navbar-inverse navbar-fixed-top">
            <div className="navbar-header">
                <a href="javascript:void(0)" className="navbar-brand">LeMojs</a>
            </div>
            <ul className="nav navbar-nav">
                <li className="dropdown">
                    <a href="javascript:void(0)" className="dropdown-toggle" data-toggle="dropdown">
                        Project <span className="caret" />
                    </a>
                    <ul className="dropdown-menu">
                        <li><a href="javascript:void(0)" onClick={ e => this.newProject() }>
                                <span className="glyphicon glyphicon-floppy-disk" />&nbsp;New</a></li>
                        <li><a href="javascript:void(0)" onClick={ e => this.saveProject() }>
                                <span className="glyphicon glyphicon-save" />&nbsp;Save</a></li>
                        <li><a href="javascript:void(0)" onClick={ e=> this.loadProject() }>
                                <span className="glyphicon glyphicon-open" />&nbsp;Load</a></li>
                        <li className="divider"></li>
                        <li><a href="javascript:void(0)"
                                onClick={ e => $(this.refs['paraModalDialog']).modal('show') }>
                                <span className="glyphicon glyphicon-list" />&nbsp;Parameters</a>
                        </li>
                    </ul>
                </li>
                <li>
                    <a href="javascript:void(0)"
                        onClick={ e => $(this.refs['helpModelDialog']).modal('show') }>Help</a>
                </li>
            </ul>
            <ul className="nav navbar-nav navbar-right">
                <li>
                    <a href="javascript:void(0)"
                        onClick={ e => $(this.refs['aboutModelDialog']).modal('show') }>About</a>
                </li>
            </ul>
        </div>
    }

    renderToolbar() {
        return <div style={{ height:'50px', lineHeight:'50px',
                position:'absolute', width:'100%', padding:'0 0.5em',
                background:'#ddd' }}>
            <div className="btn-group" style={{ boxShadow:'none' }}>
                <a className="btn dropdown-toggle" data-toggle="dropdown"
                    aria-expanded="false" title="add object">
                    <span className="glyphicon glyphicon-plus"></span>
                </a>
                <ul className="dropdown-menu">
                    <li><a href="javascript:void(0)"
                        onClick={ e => this.addAnimObject('transit') }>transit</a></li>
                    <li><a href="javascript:void(0)"
                        onClick={ e => this.addAnimObject('burst') }>burst</a></li>
                    <li><a href="javascript:void(0)"
                        onClick={ e => this.addAnimObject('motion-path') }>motion path</a></li>
                </ul>
            </div>
            <div className="btn-group" style={{ boxShadow:'none' }}>
                <a className="btn" onClick={ (e) => this.tween.start() } title="restart">
                    <span className="glyphicon glyphicon-play"></span>
                </a>
                <a className="btn" onClick={ (e) => this.tween.pause() } title="pause">
                    <span className="glyphicon glyphicon-pause"></span>
                </a>
            </div>
            <div className="pull-right">
                <div className="btn-group">
                    <a className="btn" title="zoom timeline out"
                        onClick={ e => (this.refs['table'] as TimelineTable).rescaleFrame(1/1.25) }>
                        <span className="glyphicon glyphicon-zoom-out"></span>
                    </a>
                    <a className="btn" title="zoom timeline in"
                        onClick={ e => (this.refs['table'] as TimelineTable).rescaleFrame(1.25) }>
                        <span className="glyphicon glyphicon-zoom-in"></span>
                    </a>
                </div>
            </div>
        </div>
    }

    render() {
        return <div style={{ height:'100%', paddingTop:50 }}>
            { this.renderNavBar() }
            <div style={{ height:'70%' }}>
                <div style={{ height:'100%' }}>
                    <div style={{ width:'60%' }}>
                        <CanvasMain timeline={ this }
                            canvasStyle={ this.state.canvasStyle }
                            updateCanvas={ (data) => this.setState({ canvasStyle:data }) }>
                            <div ref="anim-pool"></div>
                            <CanvasNode data={ this.activeAnimNode } timeline={ this }></CanvasNode>
                            <div ref="placeholder-for-svg-editor"></div>
                        </CanvasMain>
                    </div>
                    <div style={{ width:'40%', background:'#eee' }}>
                        <Splitter orientation="vertical" />
                        <div style={{ padding:15 }}> {
                            this.activeAnimNode ?
                                <NodeEditor data={ this.activeAnimNode } timeline={ this } /> :
                            this.activeAnimObject ?
                                <ObjectEditor data={ this.activeAnimObject } timeline={ this } /> :
                                <p>Add or Select a Node to Edit</p>}
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ height:'30%', background:'white' }}>
                <Splitter orientation="horizontal" />
                <div></div>
                { this.renderToolbar() }
                <div style={{ height:'100%', paddingTop:'50px' }}>
                    <TimelineTable ref="table" data={ this.state.timeline } timeline={ this }
                        duration={ this.tween.getDuration() } />
                </div>
            </div>
            { this.renderSaveModal() }
            { this.renderHelpModal() }
            { this.renderAboutModal() }
            { this.renderParameterModal() }
        </div>
    }
}

ReactDOM.render(<App />, document.getElementById('app'))
