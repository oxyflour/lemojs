/// <reference path="../../typings/tsd.d.ts" />

import { AnimObject, AnimNode } from '../timeline'
import {
    Action,

    AddAnimObjectAction,
    CloneAnimObjectAction,
    RemoveAnimObjectAction,

    AddAnimNodeAction,
    CloneAnimNodeAction,
    RemoveAnimNodeAction,

    ToggleAnimObjectAction,
    ExtendTimelineAction,
    UpdateTimelineAction,
} from '../actions'

function id(x, ...args) {
    return x
}

function clone(obj, ...args) {
    return $.extend({}, obj, ...args)
}

function createRedux<S>(
        defState: S,
        map: { [key: number]: (state: S, action: Action) => S },
        defRedux: (state: S, action: Action) => S = id) {
    return (state = defState, action: Action): S => {
        return (map[action.type] || defRedux)(state, action)
    }
}

export const timeline = createRedux<AnimObject[]>([ ], {
    [AddAnimNodeAction.typeId]:         (state, action) => state.map(a => {
        var { anim, node } = action as AddAnimNodeAction
        return a === anim ? clone(a, { nodes:a.nodes.concat(node) }) : a
    }),
    [CloneAnimNodeAction.typeId]:       (state, action) => state.map(a => {
        var { node } = action as CloneAnimNodeAction
        return a.nodes.indexOf(node) >= 0 ? clone(a, {
            nodes:a.nodes.slice().splice(a.nodes.indexOf(node), 0, JSON.parse(JSON.stringify(node))) }) : a
    }),
    [RemoveAnimNodeAction.typeId]:      (state, action) => state.map(a => {
        var { node } = action as RemoveAnimNodeAction
        return a.nodes.indexOf(node) >= 0 ? clone(a, { nodes:a.nodes.filter(n => n !== node) }) : a
    }),
    [AddAnimObjectAction.typeId]:       (state, action) => {
        var { anim } = action as AddAnimObjectAction
        return state.concat(anim)
    },
    [RemoveAnimObjectAction.typeId]:    (state, action) => {
        var { anim } = action as RemoveAnimObjectAction
        return state.filter(a => a !== anim)
    },
    [CloneAnimObjectAction.typeId]:     (state, action) => {
        var { anim } = action as CloneAnimObjectAction
        return state.slice().splice(state.indexOf(anim), 0, JSON.parse(JSON.stringify(anim)))
    },
    [ToggleAnimObjectAction.typeId]:    (state, action) => state.map(a => {
        var anim = (action as ToggleAnimObjectAction).anim,
            disabled = anim.disabled ? a === anim : a !== anim
        return a.disabled === disabled ? a : clone(a, { disabled })
    }),
    [ExtendTimelineAction.typeId]:      (state, action) => {
        var { oldCursor, newCursor } = action as ExtendTimelineAction,
            minCursor = 0

        state.forEach(anim => {
            var start = 0
            anim.nodes.some(node => {
                if (start <= oldCursor && oldCursor < start + node.delay) {
                    minCursor = Math.max(minCursor, start)
                    return node['needs-shift-delay'] = anim['needs-shift'] = true
                }
                start += node.delay
                if (start <= oldCursor && oldCursor < start + node.duration) {
                    minCursor = Math.max(minCursor, start)
                    return node['needs-shift-duration'] = anim['needs-shift'] = true
                }
                start += node.duration
                minCursor = Math.max(minCursor, start)
                return false
            })
        })

        newCursor = Math.max(minCursor + 1, newCursor)
        if (newCursor !== oldCursor) state = state.map(anim => {
            if (anim['needs-shift']) {
                delete anim['needs-shift']
                var nodes = anim.nodes.map(node => {
                    if (node['needs-shift-delay']) {
                        delete node['needs-shift-delay']
                        var delay = node.delay + newCursor - oldCursor
                        node = clone(node, { delay })
                    }
                    else if (node['needs-shift-duration']) {
                        delete node['needs-shift-duration']
                        var duration = node.duration + newCursor - oldCursor
                        node = clone(node, { duration })
                    }
                    return node
                })
                anim = clone(anim, { nodes })
            }
            return anim
        })

        return state
    },
    [UpdateTimelineAction.typeId]: (state, action) => {
        return state
    },
})
