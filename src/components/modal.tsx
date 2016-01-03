/// <reference path="../../typings/tsd.d.ts" />

import * as React from 'react'
import * as $ from 'jquery'

export class Modal extends React.Component<{
    title?: string,
    isSmall?: boolean,
    footer?: string | JSX.Element,

    ref?: string,
    children?: React.ReactElement<any>,
}, {}> {
    show() {
        $(this.refs['diag']).modal('show')
    }

    hide() {
        $(this.refs['diag']).modal('hide')
    }

    modal(...args) {
        $.fn.modal.apply($(this.refs['diag']), args)
    }

    render() {
        return <div ref="diag" className="modal fade" tabIndex={ -1 } role="dialog">
            <div className={ 'modal-dialog' + (this.props.isSmall ? ' modal-sm' : ' ') }>
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">×</span>
                        </button>
                        <h4 className="modal-title">{ this.props.title }</h4>
                    </div>
                    <div className="modal-body">{ this.props.children }</div>
                    { this.props.footer &&
                        <div className="modal-footer">{ this.props.footer }</div> }
                </div>
            </div>
        </div>
    }
}
