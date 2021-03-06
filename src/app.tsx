/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../typings/mojs.d.ts"/>

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { createStore } from 'redux'

import { Splitter } from './components/splitter'
import { Slider } from './components/slider'
import { CanvasMain } from './components/canvas-main'
import { PathEditor } from './components/canvas-path-editor'
import { TimelineTable } from './components/timeline-table'
import { TweenEditor, ObjectEditor } from './components/anim-editor'
import { Modal } from './components/modal'

import { Tween, Animation, AnimManager } from './timeline'

import { clone, debounce } from './utils'

import { timelineReducer } from './reducers'
import { Action } from './actions'

declare function require(path: string): any;

const PACKAGE_JSON = require('json!../package.json')
const VERSION_STRING = PACKAGE_JSON.version
const CANVAS_STYLE = { width:480, height:320, background:'#eeeeee' }

class ObjectPool {
    map = { }
    guid() {
        return Math.random() + '@' + Date.now()
    }
    clear() {
        this.map = { }
    }
    put(obj) {
        var id = obj && obj['_id'] || (obj['_id'] = this.guid())
        return id && (this.map[id] = obj)
    }
    get<T>(obj: T) {
        return obj && this.map[ obj['_id'] ] as T
    }
}

interface ProjectObject {
    version: string,
    timeline: Animation[],
    canvasStyle: { width:number, height:number, background:string },
    timelineState: boolean[],
}

export class App extends React.Component<{}, {}> {
    timeline = createStore(timelineReducer)
    tween = new AnimManager(null)
    unsubscribe: Function

    state = {
        activeTween: null as Tween,
        activeAnimation: null as Animation,
        cursorPosition: 0,

        activePathEditorTween: null as Tween,
        activePathEditorKey: '',

        canvasStyle: $.extend({}, CANVAS_STYLE),
        timelineState: null as boolean[ ]
    }

    getTimeline() {
        return this.timeline.getState() as Animation[]
    }

    getAnimationFromTween(tween: Tween) {
        return this.getTimeline().filter(anim => anim.tweens.indexOf(tween) >= 0)[0]
    }

    syncTweenDebounced = debounce(() => this.tween.sync(this.getTimeline()), 200)

    // project

    saveProject() {
        var proj: ProjectObject = {
            version: VERSION_STRING,
            canvasStyle: this.state.canvasStyle,
            timeline: this.getTimeline(),
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
            Action.replaceTimeline.dispatch(this.timeline, proj)
            this.setState(proj)
        }
        else {
            alert('the project version does not mismatch')
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

    updateStateObjects() {
        var pool = new ObjectPool()
        // FIXME: it might be slow
        this.getTimeline().forEach(anim => {
            pool.put(anim) && anim.tweens.forEach(tween => pool.put(tween))
        })
        this.state.activeTween = pool.get(this.state.activeTween)
        this.state.activeAnimation = pool.get(this.state.activeAnimation)
        this.state.activePathEditorTween = pool.get(this.state.activePathEditorTween)
    }

    componentDidMount() {
        this.tween = new AnimManager(this.refs['anim-pool'] as HTMLElement, {
            onUpdate: (p) => this.setState({ cursorPosition:p * this.tween.getDuration() }),
        })
        this.unsubscribe = this.timeline.subscribe(() => {
            this.syncTweenDebounced()
            this.updateStateObjects()
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
                            onClick={ e => $.getJSON('samples/mojs.json', (proj) => this.updateProject(proj)) }>
                                <span className="glyphicon glyphicon-save" />&nbsp;mojs</a></li>
                        <li><a href="javascript:void(0)"
                            onClick={ e => $.getJSON('samples/nsdn.json', (proj) => this.updateProject(proj)) }>
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

    renderCanvas() {
        return <CanvasMain
            cursorPosition={ this.state.cursorPosition }
            canvasStyle={ this.state.canvasStyle }
            updateCanvas={ (data) => this.setState({ canvasStyle:data }) }>
            <div ref="anim-pool"></div>
            { this.state.activePathEditorTween === this.state.activeTween &&
                this.state.activePathEditorTween && this.state.activePathEditorKey &&
                <PathEditor data={ this.state.activeTween[this.state.activePathEditorKey] || '' }
                    onClose={ () => this.setState({ activePathEditorKey:'' }) }
                    onChange={ path => Action.updateTween.dispatch(this.timeline, {
                        tween: this.state.activeTween,
                        update: { [this.state.activePathEditorKey]: path }
                    }) } /> }
        </CanvasMain>
    }

    renderEditor() {
        return <div style={{ padding:15 }}>
        {
            this.state.activeTween ?
                <TweenEditor data={ this.state.activeTween }
                    motionNames={ this.getTimeline().map(a => a.name) }
                    selectPathToEdit={ (key) => this.setState({
                        activePathEditorTween: this.state.activeTween,
                        activePathEditorKey: this.state.activePathEditorKey === key ? '' : key,
                    })}
                    cloneActiveTween={ () => Action.addTween.dispatch(this.timeline, {
                        anim: this.getAnimationFromTween(this.state.activeTween),
                        tween: this.state.activeTween
                    }) }
                    removeActiveTween={ () => Action.removeTween.dispatch(this.timeline, {
                        tween: this.state.activeTween
                    }) }
                    onChange={ (update) => Action.updateTween.dispatch(this.timeline, {
                        tween: this.state.activeTween,
                        update: update
                    }) } /> :
            this.state.activeAnimation ?
                <ObjectEditor data={ this.state.activeAnimation }
                    addTween={ () => Action.addTween.dispatch(this.timeline, {
                        anim: this.state.activeAnimation,
                        tween: { delay: 0, duration: 1000, animType: this.state.activeAnimation.animType }
                    }) }
                    cloneActiveAnimation={ () => Action.addAnimation.dispatch(this.timeline, {
                        anim: this.state.activeAnimation,
                    }) }
                    removeActiveAnimation={ () => Action.removeAnimation.dispatch(this.timeline, {
                        anim: this.state.activeAnimation
                    }) }
                    onChange={ (anim) => Action.updateAnimation.dispatch(this.timeline, {
                        anim: this.state.activeAnimation,
                        update: anim
                    }) }/> :
                <p>Add an Animation Object or Load a Sample Project to Start</p>
        }
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
                { 'transit|burst|motion-path'.split('|').map(type =>
                    <li>
                        <a href="javascript:void(0)"
                            onClick={ e => Action.addAnimation.dispatch(this.timeline, {
                                anim: { animType:type, name:type + this.getTimeline().length, tweens:[ ] }
                            }) }>{ type }</a>
                    </li>)
                }
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

    renderTimeline() {
        return <div style={{ height:'100%', paddingTop:'50px' }}>
            <TimelineTable ref="table"
                timeline={ this.getTimeline() }
                onTimelineChange={ timeline => Action.replaceTimeline.dispatch(this.timeline, {
                    timeline
                }) }
                cursorPosition={ this.state.cursorPosition }
                onCursorChange={ cursorPosition => this.setState({ cursorPosition }) }
                activeTween={ this.state.activeTween }
                setActiveTween={ activeTween => this.setState({ activeTween }) }
                updateTween={ (tween, update) => Action.updateTween.dispatch(this.timeline, {
                    tween,
                    update
                }) }
                addTween={ (anim) => Action.addTween.dispatch(this.timeline, {
                    anim,
                    tween: { delay: 0, duration: 1000, animType: anim.animType }
                }) }
                duration={ this.tween.getDuration() } />
        </div>
    }

    render() {
        return <div style={{ height:'100%', paddingTop:50 }}>
            { this.renderNavBar() }
            <div style={{ height:'70%' }}>
                <div style={{ height:'100%' }}>
                    <div style={{ width:'60%' }}>
                        { this.renderCanvas() }
                    </div>
                    <div style={{ width:'40%', background:'#eee' }}>
                        <Splitter orientation="vertical" />
                        { this.renderEditor() }
                    </div>
                </div>
            </div>
            <div style={{ height:'30%', background:'white' }}>
                <Splitter orientation="horizontal" />
                <div></div>
                { this.renderToolbar() }
                { this.renderTimeline() }
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
