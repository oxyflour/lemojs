/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

export class Switch extends React.Component<{
    checked: boolean,
    onChange: (e: React.FormEvent) => void
}, {}> {
    input: JQuery

    onChange(e: React.FormEvent) {
        var newState = !!this.props.checked,
            oldState = $(e.target).prop('checked')
        if (newState !== oldState)
            this.props.onChange(e as any as React.FormEvent)
    }

    componentDidMount() {
        this.input = $('<input type="checkbox" />')
            .appendTo(this.refs['content'] as HTMLElement)
            .bootstrapSwitch({
                state: !!this.props.checked,
                onSwitchChange: e => setTimeout(() => this.onChange(e)),
            })
    }

    componentWillUpdate(newProps) {
        this.input.bootstrapSwitch('state', !!newProps.checked)
    }

    componentWillUnmount() {
        this.input.bootstrapSwitch('destroy')
    }

    render() {
        return <div className="bootstrap-switch-square" ref="content"
            // hack to avoid display issue on chrome
            style={{ transform:'translate3d(0, 0, 0)' }} />
    }
}
