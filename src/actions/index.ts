// TODO: split it into seperated files

import { AnimObject, AnimNode } from '../timeline'

var actionId = 1

export class Action {
    type: number | string
    constructor() { this.type = this.constructor['typeid'] }
}

export class AddAnimNodeAction extends Action {
    static typeId = actionId ++
    constructor(public anim: AnimObject, public node: AnimNode) { super() }
}

export class CloneAnimNodeAction extends Action {
    static typeId = actionId ++
    constructor(public node: AnimNode) { super() }
}

export class RemoveAnimNodeAction extends Action {
    static typeId = actionId ++
    constructor(public node: AnimNode) { super() }
}

export class AddAnimObjectAction extends Action {
    static typeId = actionId ++
    constructor(public anim: AnimObject) { super() }
}

export class CloneAnimObjectAction extends Action {
    static typeId = actionId ++
    constructor(public anim: AnimObject) { super() }
}

export class RemoveAnimObjectAction extends Action {
    static typeId = actionId ++
    constructor(public anim: AnimObject) { super() }
}

export class ToggleAnimObjectAction extends Action {
    static typeId = actionId ++
    constructor(public anim: AnimObject) { super() }
}

export class ExtendTimelineAction extends Action {
    static typeId = actionId ++
    constructor(public oldCursor: number, public newCursor: number) { super() }
}

export class UpdateTimelineAction extends Action {
    static typeId = actionId ++
    constructor(public timeline: AnimObject[]) { super() }
}
