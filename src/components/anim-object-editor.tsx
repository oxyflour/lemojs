/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

import { AnimNode, AnimObject, Timeline } from '../timeline'
import { debounce } from '../utils'

class Unstringified {
    constructor(public content: string) { }
}

export class ObjectEditor extends React.Component<{
    data: AnimObject,
    timeline: Timeline,
}, {}> {
    refreshAnimObjectDebounced = debounce(() => {
        this.props.timeline.refreshAnimObject(this.props.data)
    }, 300)

    handleValueChange(key: string, val: any) {
        this.props.data[key] = val
        this.props.timeline.forceUpdate()
        this.refreshAnimObjectDebounced()
    }

    getJsonValue(val: any) {
        return val instanceof Unstringified ? (val as Unstringified).content : JSON.stringify(val)
    }

    handleJsonChange(key: string, val: string) {
        try {
            val = JSON.parse(val)
            this.handleValueChange(key, val)
        }
        catch (e) {
            this.props.data[key] = new Unstringified(val)
            this.props.timeline.forceUpdate()
        }
    }

    render() {
        return <form className="form-horizontal">
            <div className="form-group">
                <div className="col-xs-12">
                    <a className="btn btn-danger"
                        onClick={ e => this.props.timeline.removeActiveAnimObject() }
                        title="shortcut: Del">Remove</a>
                    &nbsp;
                    <a className="btn btn-primary"
                        onClick={ e => this.props.timeline.cloneActiveAnimObject() }
                        title="shortcut: Ctrl-C">Clone</a>
                </div>
            </div>
            <div className="form-group">
                <label className="col-xs-4 control-label">name</label>
                <div className="col-xs-8">
                    <input type="text" className="form-control" placeholder="object name"
                        value={ this.props.data.name }
                        onChange={ e => this.handleValueChange('name', e.target['value']) } />
                </div>
            </div>
            <div className="form-group">
                <div className="col-xs-8 col-xs-offset-4">
                    <label>
                        <input type="checkbox" checked={ this.props.data.disabled }
                            onChange={ e => this.handleValueChange('disabled', e.target['checked']) } />
                        &nbsp;
                        disabled
                    </label>
                </div>
            </div>
            <div className="form-group">
                <label className="col-xs-4 control-label">staggerArray</label>
                <div className={ 'col-xs-8 ' + (this.props.data['stagger'] instanceof Unstringified ? 'has-error' : '') }>
                    <textarea className="form-control" placeholder="array literal"
                        value={ this.getJsonValue(this.props.data['stagger']) || '' }
                        onChange={ e => this.handleJsonChange('stagger', $(e.target).val()) } />
                </div>
            </div>
            <div className="form-group">
                <label className="col-xs-4 control-label">staggerDelay</label>
                <div className="col-xs-8">
                    <input type="number" className="form-control" placeholder="number"
                        min="0" step="1" value={ this.props.data['delayDelta'] }
                        onChange={ e => this.handleValueChange('delayDelta', parseInt($(e.target).val())) } />
                </div>
            </div>
        </form>
    }
}
