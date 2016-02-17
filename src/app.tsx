/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../typings/mojs.d.ts"/>

import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { Splitter } from './components/splitter'
import { Slider } from './components/slider'
import { ObjectEditor, NodeEditor } from './components/anim-editor'
import { CanvasMain } from './components/canvas-main'
import { PathEditor } from './components/canvas-path-editor'
import { TimelineTable } from './components/timeline-table'
import { Modal } from './components/modal'

import { AnimNode, AnimObject, AnimManager, Timeline } from './timeline'

import {
    AddAnimNodeAction,
    RemoveAnimNodeAction,
    CloneAnimNodeAction,

    AddAnimObjectAction,
    RemoveAnimObjectAction,
    CloneAnimObjectAction,

    ToggleAnimObjectAction,
    ExtendTimelineAction,
    UpdateTimelineAction,
} from './actions'

import { timeline } from './store'

import { debounce } from './utils'

const VERSION_STRING = '0.0.1'
const CANVAS_STYLE = { width:480, height:320, background:'#eeeeee' }

interface ProjectObject {
    version: string,
    timeline: AnimObject[],
    canvasStyle: { width:number, height:number, background:string },
    timelineState: boolean[],
}

export class App extends React.Component<{}, {}> implements Timeline {
    tween = new AnimManager(null)
    unsubscribe: Function
    state = {
        activeAnimNode: null as AnimNode,
        activeAnimObject: null as AnimObject,
        cursorPosition: 0,

        pathToEdit: null as { node:AnimNode, key:string },

        canvasStyle: $.extend({}, CANVAS_STYLE),
        timelineState: null as boolean[ ]
    }

    shiftAnimObjectToCursor(newCursor: number) {
        timeline.dispatch(new ExtendTimelineAction(this.state.cursorPosition, newCursor))
    }

    toggleAnimObjectEnableDisable(anim: AnimObject) {
        timeline.dispatch(new ToggleAnimObjectAction(anim))
    }

    getTimeline() {
        return timeline.getState()
    }

    getAnimObjectFromNode(node: AnimNode) {
        return timeline.getState().filter(anim => anim.nodes.indexOf(node) >= 0)[0]
    }

    setPathToEdit(node: AnimNode, key: string) {
        this.setState({ pathToEdit:{ node, key } })
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
        if (this.state.activeAnimNode)
            timeline.dispatch(new RemoveAnimNodeAction(this.state.activeAnimNode))
        this.activeAnimNode = null
    }

    cloneActiveAnimNode() {
        if (this.state.activeAnimNode)
            timeline.dispatch(new CloneAnimNodeAction(this.state.activeAnimNode))
    }

    addAnimNode(index?: number) {
        var timeline = timeline.getState()
        if (index >= 0 && timeline[index])
            this.activeAnimObject = timeline[index]
        if (this.activeAnimObject) {
            var animType = this.activeAnimObject.animType,
                node = { delay:0, duration:1000, animType }
            timeline.dispatch(new AddAnimNodeAction(this.activeAnimObject, node))
            this.activeAnimNode = node
        }
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
        if (this.activeAnimObject)
            timeline.dispatch(new RemoveAnimObjectAction(this.activeAnimObject))
        this.activeAnimObject = null
    }

    cloneActiveAnimObject() {
        if (this.activeAnimObject)
            timeline.dispatch(new CloneAnimObjectAction(this.activeAnimObject))
    }

    addAnimObject(type: string) {
        var timeline = timeline.getState()
        var anim = {
            name: type + timeline.length,
            animType: type,
            nodes: [ ],
        }
        timeline.dispatch(new AddAnimObjectAction(anim))
        this.activeAnimObject = anim
    }

    refreshAnimObject(node: AnimNode | AnimObject) {
        var anim = node['nodes'] ? node as AnimObject : this.getAnimObjectFromNode(node as AnimNode)
        if (anim) {
            this.tween.update(anim)
            this.tween.setProgress(this.cursorPosition / this.tween.getDuration())
        }
    }

    refreshAnimObjectDebounced = debounce(() => this.refreshAnimObject(this.activeAnimNode), 300)

    // project

    saveProject() {
        var proj: ProjectObject = {
            version: VERSION_STRING,
            canvasStyle: this.state.canvasStyle,
            timeline: timeline.getState(),
            timelineState: this.state.timelineState,
        }
        var content = JSON.stringify(proj, null, 2)
        $(this.refs['saveProjectLink']).attr('href',
            'data:text/json;charset=utf-8,' + encodeURIComponent(content))
        void (this.refs['saveModelDialog'] as Modal).show()
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
            timeline.dispatch(new UpdateTimelineAction(proj.timeline))
            this.state.activeAnimNode = this.state.activeAnimObject = null
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
        this.unsubscribe = timeline.subscribe(() => {
            this.tween.sync(timeline.getState())
            this.forceUpdate()
        })
    }

    componentWillUnmount() {
        this.unsubscribe()
    }

    // view

    renderNavBar() {
        return <div className="navbar navbar-inverse navbar-fixed-top">
            <div className="navbar-header">
                <a href="javascript:void(0)" className="navbar-brand">LeMojs</a>
            </div>
            <ul className="nav navbar-nav collapse navbar-collapse">
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
                                onClick={ e => (this.refs['paraModalDialog'] as Modal).show() }>
                                <span className="glyphicon glyphicon-list" />&nbsp;Parameters</a>
                        </li>
                    </ul>
                </li>
                <li className="dropdown">
                    <a href="javascript:void(0)" className="dropdown-toggle" data-toggle="dropdown">
                        Samples <span className="caret" />
                    </a>
                    <ul className="dropdown-menu">
                        <li><a href="javascript:void(0)"
                            onClick={ e => $.getJSON('proj-mojs.json', (proj) => this.updateProject(proj)) }>
                                <span className="glyphicon glyphicon-save" />&nbsp;mojs</a></li>
                        <li><a href="javascript:void(0)"
                            onClick={ e => $.getJSON('proj-nsdn.json', (proj) => this.updateProject(proj)) }>
                                <span className="glyphicon glyphicon-save" />&nbsp;nsdn</a></li>
                    </ul>
                </li>
                <li>
                    <a href="javascript:void(0)"
                        onClick={ e => (this.refs['helpModelDialog'] as Modal).show() }>Help</a>
                </li>
            </ul>
            <ul className="nav navbar-nav navbar-right collapse navbar-collapse">
                <li>
                    <a href="javascript:void(0)"
                        onClick={ e => (this.refs['aboutModelDialog'] as Modal).show() }>About</a>
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
                        <CanvasMain
                            cursorPosition={ timeline.getState().cursorPosition }
                            canvasStyle={ this.state.canvasStyle }
                            updateCanvas={ (data) => this.setState({ canvasStyle:data }) }>
                            <div ref="anim-pool"></div>
                            { this.state.pathToEdit && this.activeAnimNode &&
                                this.state.pathToEdit.node === this.activeAnimNode &&
                                <PathEditor data={ this.activeAnimNode[this.state.pathToEdit.key] || '' }
                                    onChange={
                                        d => {
                                            this.activeAnimNode[this.state.pathToEdit.key] = d
                                            this.forceUpdate()
                                            this.refreshAnimObjectDebounced()
                                        }
                                    } /> }
                        </CanvasMain>
                    </div>
                    <div style={{ width:'40%', background:'#eee' }}>
                        <Splitter orientation="vertical" />
                        <div style={{ padding:15 }}> {
                            this.activeAnimNode ?
                                <NodeEditor data={ this.activeAnimNode }
                                    motionNames={ timeline.getState().map(a => a.name) }
                                    cloneActiveAnimNode={ () => this.cloneActiveAnimNode() }
                                    removeActiveAnimNode={ () => this.removeActiveAnimNode() }
                                    setPathToEdit={ (node, key) => this.setPathToEdit(node, key) }
                                    onChange={ () => 0 } /> :
                            this.activeAnimObject ?
                                <ObjectEditor data={ this.activeAnimObject }
                                    addAnimNode={ () => this.addAnimNode() }
                                    cloneActiveAnimObject={ () => this.cloneActiveAnimObject() }
                                    removeActiveAnimObject={ () => this.removeActiveAnimObject() }
                                    onChange={ () => 0 }/> :
                                <p>Add an Animation Object or Load a Sample Project to Start</p>}
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ height:'30%', background:'white' }}>
                <Splitter orientation="horizontal" />
                <div></div>
                { this.renderToolbar() }
                <div style={{ height:'100%', paddingTop:'50px' }}>
                    <TimelineTable ref="table" data={ timeline.getState() } timeline={ this }
                        duration={ this.tween.getDuration() } />
                </div>
            </div>
            <Modal ref="saveModelDialog" title="Save Project">
                <p>Click <a ref="saveProjectLink" download="project.json">here</a> to download project</p>
            </Modal>
            <Modal ref="helpModelDialog" title="LeMojs Help">
                <p>help content to be updated...</p>
            </Modal>
            <Modal ref="aboutModelDialog" title="About">
                <p>A Lightweight editor for <a href="https://github.com/legomushroom/mojs">mojs</a></p>
                <a href="https://github.com/oxyflour/lemojs">Github Repo Link</a>
            </Modal>
            <Modal ref="paraModalDialog" title="Parameters">
                <p>you can reference the following values with P.parameterName in fields</p>
                <p>not implemented yet</p>
            </Modal>
        </div>
    }
}

ReactDOM.render(<App />, document.getElementById('app'))
