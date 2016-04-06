/// <reference path="../typings/tsd.d.ts" />

import { AnimObject, AnimNode } from './timeline'

import { Action } from './actions'

import { clone } from './utils'

function createRedux<S>(
        defState: S,
        map: { [key: number]: (state: S, action: Action) => S },
        defRedux: (state: S, action: Action) => S = x => x) {
    return (state = defState, action: Action): S => {
        return (map[action.type] || defRedux)(state, action)
    }
}

export const timelineReducer = createRedux<AnimObject[]>([ ], {
    [Action.addAnimNode.type]: (state, action) => state.map(a => {
        var { anim, node, index } = Action.addAnimNode.from(action)
        if (a === anim) {
            var nodes = a.nodes.slice()
            nodes.splice(+index === index ? index : nodes.length, 0, clone(node))
            a = clone(a, { nodes })
        }
        return a
    }),
    [Action.updateAnimNode.type]: (state, action) => state.map(a => {
        var { node, update } = Action.updateAnimNode.from(action)
        if (a.nodes.indexOf(node) >= 0) {
            var nodes = a.nodes.map(n => n === node ? clone(n, update) : n)
            a = clone(a, { nodes })
        }
        return a
    }),
    [Action.removeAnimNode.type]: (state, action) => state.map(a => {
        var { node } = Action.removeAnimNode.from(action)
        if (a.nodes.indexOf(node) >= 0) {
            var nodes = a.nodes.filter(n => n !== node)
            a = clone(a, { nodes })
        }
        return a
    }),
    [Action.addAnimObject.type]: (state, action) => {
        var { anim } = Action.addAnimObject.from(action)
        return state.concat(clone(anim))
    },
    [Action.updateAnimObject.type]: (state, action) => {
        var { anim, update } = Action.updateAnimObject.from(action)
        return state.map(a => a === anim ? clone(a, update) : a)
    },
    [Action.removeAnimObject.type]: (state, action) => {
        var { anim } = Action.removeAnimObject.from(action)
        return state.filter(a => a !== anim)
    },
    [Action.replaceTimeline.type]: (state, action) => {
        var { timeline } = Action.replaceTimeline.from(action)
        return timeline
    }
})
